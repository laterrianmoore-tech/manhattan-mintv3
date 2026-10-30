import { cookies } from "next/headers";
import AdminLoginForm from "../dispatch/AdminLoginForm";
import BrokerPaidForm from "./BrokerPaidForm";
import CopyLink from "./CopyLink";
import { brokerStatsFor, listBrokerPartners } from "@/lib/brokers";
import { partnerUrl } from "@/lib/manage-token";
import { publicSiteUrl, referralLink } from "@/lib/referral";

export const dynamic = "force-dynamic";

// Broker partners (2026-10-30): every referring broker, the two links to
// send them (their quote link and their private tracking page), what they've
// produced, and what they're owed this Friday. Fees, each once per client:
// $40 on a referred client's first completed paid clean, $75 the first time
// that client completes a recurring visit (src/lib/brokers.ts). The Thursday
// payroll text lists the same owed amounts; after the Zelle/Venmo, "Mark
// paid" here stamps them.

function fmt(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function PartnersAdminPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("mm_admin")?.value !== process.env.ADMIN_PASSWORD) return <AdminLoginForm />;

  const siteUrl = publicSiteUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);
  const { partners, source, error } = await listBrokerPartners();
  const stats = await Promise.all(partners.map((p) => brokerStatsFor(p)));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          <span style={{ color: "#1d9e75" }}>Manhattan Mint</span>
          <span className="text-gray-400 font-normal"> — Partners</span>
        </h1>
        <div className="flex gap-4 text-sm font-medium">
          <a href="/admin/dispatch/" className="hover:underline" style={{ color: "#1d9e75" }}>Dispatch</a>
          <a href="/admin/accounting/" className="hover:underline" style={{ color: "#1d9e75" }}>Accounting</a>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-6">Brokers who send clients. Each fee is once per client: $40 on their first completed, paid clean and $75 on their first recurring visit. Paid Fridays by Zelle or Venmo; the Thursday payroll text lists them.</p>

      {(source === "seed" || error) && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          Partner tracking isn&apos;t in the database yet — run <code className="text-xs">lib/supabase/migrations/2026-10-30-broker-partners.sql</code> in the Supabase SQL editor. Until then the links below work, but clicks and bookings aren&apos;t being recorded.
        </p>
      )}

      {stats.map((s) => {
        const owedJobs = s.jobs.filter((j) => j.fee > 0 && !j.feePaidAt);
        const quoteLink = referralLink(s.partner.code, siteUrl);
        const trackLink = partnerUrl(s.partner.code, siteUrl);
        return (
          <section key={s.partner.code} className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {s.partner.name} <span className="text-gray-400 font-normal text-sm">· code {s.partner.code}</span>
              </h2>
              <span className="text-xs text-gray-500">
                ${s.partner.feePerJob} first clean · ${s.partner.feeRecurring} recurring, once per client
                {s.partner.payoutHandle ? ` · ${s.partner.payoutMethod ?? "pay"} ${s.partner.payoutHandle}` : " · payout handle not set"}
              </span>
            </div>
            {(s.partner.contactName || s.partner.contactEmail) && (
              <p className="text-xs text-gray-500 mb-3">
                {s.partner.contactName}
                {s.partner.contactEmail ? ` · ${s.partner.contactEmail}` : ""}
              </p>
            )}

            <div className="grid gap-2 mb-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24 text-gray-500">Client link</span>
                <code className="flex-1 min-w-[200px] truncate rounded bg-gray-50 px-2 py-1">{quoteLink}</code>
                <CopyLink url={quoteLink} label="Copy" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24 text-gray-500">Tracking page</span>
                <code className="flex-1 min-w-[200px] truncate rounded bg-gray-50 px-2 py-1">{trackLink}</code>
                <CopyLink url={trackLink} label="Copy" />
                <a href={trackLink} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-xs font-medium hover:bg-gray-50">Open</a>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
              {[
                ["Clicks", s.clicks],
                ["Bookings", s.bookings],
                ["Completed", s.completed],
                ["Clients", s.newClients],
                ["Recurring", s.recurringConversions],
                ["Earned", `$${s.feesEarned}`],
                ["Owed", `$${s.feesOwed}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl bg-gray-50 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
                  <div className="text-base font-semibold text-gray-900">{value}</div>
                </div>
              ))}
            </div>

            {owedJobs.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">Owed this Friday: ${s.feesOwed}</p>
                <ul className="text-xs text-amber-900 mb-2 space-y-0.5">
                  {owedJobs.map((j) => (
                    <li key={j.bookingId}>
                      {fmt(j.date)} · {j.client} · {j.apartment} · ${j.fee}
                      {j.firstClean && j.recurringBonus ? " (first clean + recurring)" : j.recurringBonus ? " (recurring)" : " (first clean)"}
                    </li>
                  ))}
                </ul>
                <BrokerPaidForm code={s.partner.code} name={s.partner.name} total={s.feesOwed} count={owedJobs.length} />
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-3">Nothing owed right now.</p>
            )}

            {s.jobs.length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1 font-medium">Date</th>
                    <th className="py-1 font-medium">Client</th>
                    <th className="py-1 font-medium">Apartment</th>
                    <th className="py-1 font-medium">Status</th>
                    <th className="py-1 font-medium text-right">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {s.jobs.map((j) => (
                    <tr key={j.bookingId} className="border-t border-gray-100">
                      <td className="py-1.5 whitespace-nowrap">{fmt(j.date)}</td>
                      <td className="py-1.5 whitespace-nowrap">{j.client}</td>
                      <td className="py-1.5 text-gray-500">
                        {j.apartment}
                        {j.recurring ? " · recurring" : ""}
                      </td>
                      <td className="py-1.5 whitespace-nowrap">{j.statusLabel}</td>
                      <td className="py-1.5 text-right whitespace-nowrap">
                        {j.fee ? `$${j.fee}${j.feePaidAt ? ` paid${j.feeRef ? ` (${j.feeRef})` : ""}` : " owed"}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}

      <p className="text-xs text-gray-400">
        New partner: insert a row in <code>broker_partners</code> (code, name, contact, payout handle) and the links appear here. Fees default to $40 / $75.
      </p>
    </div>
  );
}
