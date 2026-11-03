import { supabaseAdmin } from "@/lib/supabase/server";
import { verifySignToken } from "@/lib/manage-token";
import { AGREEMENT_SECTIONS, COMPANY_NAME, COMPANY_SIGNER, COMPANY_SIGNER_TITLE, agreementIntro, effectiveDateLabel } from "@/lib/contractor-agreement";
import SignForm from "./SignForm";

// /sign/?c=<cleanerId>&t=<hmac> — the Independent Contractor Agreement, filled
// in for one cleaner, with a typed e-signature at the bottom (2026-11-03).
// The link is minted by signUrl() in src/lib/manage-token.ts and goes out in
// the onboarding packet. Signing posts to /api/sign.
export const dynamic = "force-dynamic";

const GREEN = "#1e4d38";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ background: "#f4f1ea", minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", background: "#faf8f4", borderRadius: 14, padding: "32px 28px", boxShadow: "0 1px 2px rgba(0,0,0,.05)" }}>
        {children}
      </div>
    </main>
  );
}

export default async function SignPage({ searchParams }: { searchParams: Promise<{ c?: string | string[]; t?: string | string[] }> }) {
  const sp = await searchParams;
  const cleanerId = String(Array.isArray(sp.c) ? sp.c[0] : sp.c ?? "").trim();
  const token = String(Array.isArray(sp.t) ? sp.t[0] : sp.t ?? "").trim();

  const invalid = (
    <Shell>
      <h1 style={{ fontFamily: "Georgia,serif", color: GREEN, fontSize: 26, margin: "0 0 12px" }}>This link isn&rsquo;t valid</h1>
      <p style={{ color: "#4a4a44", lineHeight: 1.55 }}>Open the signing link from your onboarding email or text, or text us at (914) 863-7902 and we&rsquo;ll send a fresh one.</p>
    </Shell>
  );
  if (!cleanerId || !verifySignToken(cleanerId, token)) return invalid;

  // The e-sign columns arrive with migrations/2026-11-03-onboarding-packet.sql.
  // Before it has run, still show the agreement (with the base columns) so the
  // applicant can read it; the signature itself then fails with a clear message.
  type SignRow = {
    id: string; first_name: string; last_name: string; email: string; phone: string; status: string;
    legal_name: string | null; address: string | null; ica_signed_at: string | null; ica_signed_name: string | null;
  };
  const baseCols = "id, first_name, last_name, email, phone, status";
  let c: SignRow | null = null;
  const full = await supabaseAdmin.from("cleaners").select(`${baseCols}, legal_name, address, ica_signed_at, ica_signed_name`).eq("id", cleanerId).single();
  if (!full.error && full.data) {
    c = full.data as unknown as SignRow;
  } else if (full.error && /legal_name|ica_signed_at|address/i.test(full.error.message)) {
    const base = await supabaseAdmin.from("cleaners").select(baseCols).eq("id", cleanerId).single();
    if (!base.error && base.data) c = { ...(base.data as Omit<SignRow, "legal_name" | "address" | "ica_signed_at" | "ica_signed_name">), legal_name: null, address: null, ica_signed_at: null, ica_signed_name: null };
  }
  if (!c) return invalid;

  const signed = !!c.ica_signed_at;
  const contractorName = (signed && c.ica_signed_name) || c.legal_name || `${c.first_name} ${c.last_name || ""}`.trim();
  const effective = effectiveDateLabel(c.ica_signed_at || new Date().toISOString());

  return (
    <Shell>
      <p style={{ margin: 0, fontFamily: "'DM Sans',Helvetica,Arial,sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#9a9a92" }}>
        Manhattan Mint NYC LLC
      </p>
      <h1 style={{ fontFamily: "Georgia,serif", color: GREEN, fontSize: 28, margin: "6px 0 18px" }}>Independent Contractor Agreement</h1>

      {!signed && (
        <p style={{ background: "#eef5f0", border: `1px solid ${GREEN}22`, borderRadius: 10, padding: "12px 14px", color: "#2d4a3b", lineHeight: 1.5, fontSize: 15, margin: "0 0 22px" }}>
          Hi {c.first_name} — please read the agreement below. Your typed name at the bottom is your signature. You&rsquo;ll get a signed PDF copy by email right away.
        </p>
      )}

      <article style={{ color: "#262622", fontSize: 15, lineHeight: 1.6, fontFamily: "Georgia,'Times New Roman',serif" }}>
        <p>{agreementIntro(contractorName, effective)}</p>
        {AGREEMENT_SECTIONS.map((s) => (
          <section key={s.heading} style={{ marginTop: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#141414", fontFamily: "'DM Sans',Helvetica,Arial,sans-serif" }}>{s.heading}</h2>
            {s.clauses.map((cl, i) => (
              <p key={i} style={{ margin: "0 0 8px", paddingLeft: /^\s+\(/.test(cl) ? 24 : 0 }}>{cl.trim()}</p>
            ))}
          </section>
        ))}
        <p style={{ marginTop: 22 }}>IN WITNESS WHEREOF, the Parties execute this Agreement as of the Effective Date.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 16 }}>
          <div style={{ border: "1px solid #e5e1d6", borderRadius: 10, padding: 14, fontSize: 14 }}>
            <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{COMPANY_NAME.toUpperCase()}</p>
            <p style={{ margin: 0 }}>By: /s/ {COMPANY_SIGNER}</p>
            <p style={{ margin: 0 }}>Name: {COMPANY_SIGNER}</p>
            <p style={{ margin: 0 }}>Title: {COMPANY_SIGNER_TITLE}</p>
            <p style={{ margin: 0 }}>Date: {effective}</p>
          </div>
          <div style={{ border: "1px solid #e5e1d6", borderRadius: 10, padding: 14, fontSize: 14 }}>
            <p style={{ margin: "0 0 6px", fontWeight: 700 }}>CONTRACTOR</p>
            <p style={{ margin: 0 }}>Print Name: {contractorName}</p>
            <p style={{ margin: 0 }}>Email: {c.email}</p>
            <p style={{ margin: 0 }}>Phone: {c.phone}</p>
            <p style={{ margin: 0 }}>Address: {c.address || "—"}</p>
            <p style={{ margin: 0 }}>Date: {effective}</p>
          </div>
        </div>
      </article>

      <SignForm
        cleanerId={c.id}
        token={token}
        defaultName={c.legal_name || `${c.first_name} ${c.last_name || ""}`.trim()}
        defaultAddress={c.address || ""}
        signedAt={c.ica_signed_at}
        signedName={c.ica_signed_name}
      />
    </Shell>
  );
}
