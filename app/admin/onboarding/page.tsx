import { cookies } from "next/headers";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import AdminLoginForm from "../dispatch/AdminLoginForm";
import OnboardingActions from "./OnboardingActions";
import { connectOnboardUrl, signUrl } from "@/lib/manage-token";
import { certnConfigured, siteUrl } from "@/lib/onboarding-packet";

// /admin/onboarding (2026-11-03): every cleaner who isn't inactive, with the
// four gates to dispatch — packet sent, agreement signed, Stripe payouts
// finished, Certn — and a Send / Resend packet button that fires
// /api/cleaners/onboarding-packet.
export const dynamic = "force-dynamic";

const GREEN = "#1d9e75";

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  legal_name: string | null;
  email: string;
  phone: string;
  status: string;
  stripe_account_id: string | null;
  certn_report_id: string | null;
  certn_invited_at: string | null;
  onboarding_packet_sent_at: string | null;
  ica_signed_at: string | null;
  ica_signed_name: string | null;
  created_at: string;
};

function when(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }) : "";
}

export default async function OnboardingAdminPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("mm_admin")?.value !== process.env.ADMIN_PASSWORD) return <AdminLoginForm />;

  const cols = "id, first_name, last_name, email, phone, status, stripe_account_id, certn_report_id, created_at";
  const newCols = ", legal_name, certn_invited_at, onboarding_packet_sent_at, ica_signed_at, ica_signed_name";
  let migrated = true;
  let res = await supabaseAdmin.from("cleaners").select(cols + newCols).neq("status", "inactive").order("created_at", { ascending: false });
  if (res.error) {
    migrated = false;
    res = (await supabaseAdmin.from("cleaners").select(cols).neq("status", "inactive").order("created_at", { ascending: false })) as typeof res;
  }
  const rows: Row[] = ((res.data ?? []) as unknown as Partial<Row>[])
    .filter((r) => r.first_name !== "Test" && r.first_name !== "External")
    .map((r) => ({
      legal_name: null, certn_invited_at: null, onboarding_packet_sent_at: null, ica_signed_at: null, ica_signed_name: null,
      ...r,
    }) as Row);

  // Stripe: has she finished Connect onboarding? One retrieve per account.
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const payouts = new Map<string, "enabled" | "pending" | "unknown">();
  if (stripeKey) {
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });
    await Promise.all(
      rows.filter((r) => r.stripe_account_id).map(async (r) => {
        try {
          const a = await stripe.accounts.retrieve(r.stripe_account_id as string);
          payouts.set(r.id, a.details_submitted && a.payouts_enabled ? "enabled" : "pending");
        } catch {
          payouts.set(r.id, "unknown");
        }
      }),
    );
  }

  const site = siteUrl();
  const pending = rows.filter((r) => r.status !== "active");
  const active = rows.filter((r) => r.status === "active");

  const Gate = ({ ok, label, sub }: { ok: boolean | null; label: string; sub?: string }) => (
    <div className="text-xs leading-snug">
      <span className={ok === true ? "text-emerald-700" : ok === false ? "text-gray-400" : "text-amber-600"}>{ok === true ? "✓" : ok === false ? "○" : "…"}</span>{" "}
      <span className="text-gray-800">{label}</span>
      {sub && <span className="text-gray-500"> · {sub}</span>}
    </div>
  );

  const table = (list: Row[], title: string) => (
    <section className="mb-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-3">{title} <span className="text-gray-400 font-normal">({list.length})</span></h2>
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">Nobody here.</p>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const pay = r.stripe_account_id ? payouts.get(r.id) ?? "unknown" : null;
            const certnOk = r.certn_report_id ? null : false;
            return (
              <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4 grid gap-3 md:grid-cols-[1.2fr_1.6fr_auto] md:items-start">
                <div>
                  <p className="font-medium text-gray-900">{r.legal_name || `${r.first_name} ${r.last_name}`.trim()}{r.legal_name && r.legal_name !== `${r.first_name} ${r.last_name}`.trim() ? <span className="text-gray-500 font-normal"> ({r.first_name})</span> : null}</p>
                  <p className="text-xs text-gray-500 break-all">{r.email}</p>
                  <p className="text-xs text-gray-500">{r.phone} · {r.status.replace(/_/g, " ")} · applied {when(r.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <Gate ok={!!r.onboarding_packet_sent_at} label="Packet sent" sub={when(r.onboarding_packet_sent_at) || undefined} />
                  <Gate ok={!!r.ica_signed_at} label="Agreement signed" sub={r.ica_signed_at ? `${when(r.ica_signed_at)} by ${r.ica_signed_name ?? ""}` : undefined} />
                  <Gate ok={pay === "enabled" ? true : pay === null ? false : null} label="Stripe payouts" sub={pay === null ? "no account yet" : pay === "enabled" ? r.stripe_account_id ?? undefined : `${r.stripe_account_id} — not finished`} />
                  <Gate ok={certnOk} label="Certn" sub={r.certn_report_id ? `invited ${when(r.certn_invited_at) || ""} · ${r.certn_report_id}` : certnConfigured() ? "not invited" : "no API key — invite by hand"} />
                </div>
                <OnboardingActions
                  cleanerId={r.id}
                  name={r.first_name}
                  sentAt={r.onboarding_packet_sent_at}
                  signLink={signUrl(r.id, site)}
                  connectLink={r.stripe_account_id ? connectOnboardUrl(r.stripe_account_id, site) : null}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          <span style={{ color: GREEN }}>Manhattan Mint</span>
          <span className="text-gray-400 font-normal"> — Onboarding</span>
        </h1>
        <div className="flex gap-4">
          <a href="/admin/dispatch/" className="text-sm font-medium hover:underline" style={{ color: GREEN }}>← Dispatch</a>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        The packet (Stripe payout link, Certn invite, e-sign agreement) goes out by itself when someone submits <a className="underline" href="/onboarding/">/onboarding</a>.
        Use the button to send it to a cleaner you added by hand, or to resend. Set <code>status</code> to <code>active</code> in Supabase once all four gates clear.
      </p>
      {!migrated && (
        <p className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Run <code>lib/supabase/migrations/2026-11-03-onboarding-packet.sql</code> in Supabase — until then packet, signature and Certn-invite stamps can&rsquo;t be stored.
        </p>
      )}
      {!certnConfigured() && (
        <p className="mb-6 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Certn invites are manual until <code>CERTN_API_KEY</code> is set in Netlify; the packet still tells the applicant to expect the Certn email.
        </p>
      )}
      {table(pending, "Onboarding")}
      {table(active, "Active cleaners")}
    </div>
  );
}
