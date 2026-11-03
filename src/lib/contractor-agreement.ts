// Independent Contractor Agreement — the text of
// 02_Hiring/Independent_Contractor_Agreement_Manhattan_Mint_NYC_LLC_vF.docx
// (2026-05-27), typed here so /sign can show it and the signed PDF can be
// rendered without a Word round-trip. Change the wording there and here
// together, and bump AGREEMENT_VERSION so old signatures keep pointing at
// the text they actually signed.
//
// This module has no server-only imports: the /sign page (client component)
// reads the same sections the PDF is built from.

export const AGREEMENT_VERSION = "2026-05-27-vF";
export const COMPANY_NAME = "Manhattan Mint NYC LLC";
export const COMPANY_SIGNER = "Laterrian Moore";
export const COMPANY_SIGNER_TITLE = "Founder & Member";

export type AgreementSection = { heading: string; clauses: string[] };

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    heading: "1. Engagement and Scope",
    clauses: [
      "1.1  The Company engages the Contractor on a non-exclusive basis to perform residential cleaning services (the “Services”) for the Company’s clients in New York City, and the Contractor accepts that engagement on the terms of this Agreement.",
      "1.2  The Contractor will perform the Services in accordance with the Company’s published service standards, including the Manhattan Mint Standard Operating Procedures, as updated by the Company from time to time.",
      "1.3  The Contractor may accept or decline any job offered by the Company in the Contractor’s sole discretion. The Contractor controls the means, methods, hours, and manner of performing the Services, subject only to the Company’s service standards and applicable law.",
    ],
  },
  {
    heading: "2. Independent Contractor Status",
    clauses: [
      "2.1  The Parties intend that the Contractor is an independent contractor and not an employee, agent, partner, or joint venturer of the Company. In support of that classification, the Parties acknowledge that:",
      "    (a) the Contractor is free from the direction and control of the Company in performing the Services, except as required to meet service standards;",
      "    (b) the Services are performed off the Company’s premises, at customer locations of the Contractor’s acceptance;",
      "    (c) the Contractor is engaged in an independently established cleaning trade, occupation, or business and may perform similar services for others; and",
      "    (d) the Contractor maintains the Contractor’s own business expenses, equipment, supplies, and insurance, and bears the risk of profit or loss.",
      "2.2  The Contractor is not entitled to employee benefits, including paid time off, health insurance, retirement plan participation, unemployment insurance, or workers’ compensation coverage from the Company. The Contractor is solely responsible for all federal, state, and local income, self-employment, and other taxes arising from compensation under this Agreement. The Company will report compensation on IRS Form 1099-NEC where required by law.",
      "2.3  Nothing in this Agreement creates an exclusive relationship. The Contractor may perform similar services for others, provided doing so does not breach Sections 7 (Confidentiality) or 8 (Non-Solicitation) and does not impair performance of accepted jobs under this Agreement.",
    ],
  },
  {
    heading: "3. Compensation",
    clauses: [
      "3.1  Rates. The Company will compensate the Contractor at an hourly rate of $45.00 to $55.00 per hour for accepted and completed Services. The specific rate within that range will be communicated by the Company at the time each job is offered, and may vary based on factors including job type, scope, complexity, and whether the Contractor has been designated as the customer's ongoing cleaner. The Contractor is free to accept or decline any specific job based on the rate offered. Accepted rates are recorded in the Company's dispatch system.",
      "3.2  Tips. The Contractor retains 100% of any gratuities received in connection with the Services. The Company will not withhold or share in any portion of such gratuities.",
      "3.3  Pay Schedule. The Company will pay the Contractor weekly, every Friday, for Services completed during the prior Sunday-through-Saturday cycle, via Stripe Connect or other electronic means designated by the Company. The Contractor must maintain an active payment account in good standing as a condition of receiving payment.",
      "3.4  Travel. The Company will not reimburse ordinary commuting or travel within the Contractor’s designated service areas. Pre-approved travel outside such areas, when specifically requested by the Company, will be reimbursed at actual cost.",
      "3.5  Freelance Isn't Free Act Acknowledgment. The Parties acknowledge that this Agreement satisfies the writing, itemization, rate, and timing requirements of the New York City Freelance Isn’t Free Act (NYC Admin. Code §§ 20-927 et seq.) and the New York State Freelance Isn’t Free Act (Gen. Bus. Law Art. 44-A). The Parties further acknowledge that, where the rate for a specific job is communicated at the time the job is offered, the Contractor’s acceptance of the job constitutes written agreement to that rate, and the Company will retain a record of each accepted offer in the dispatch system.",
    ],
  },
  {
    heading: "4. Cancellation and Lockout Compensation",
    clauses: [
      "4.1  When a customer cancels or fails to provide access for a scheduled job, the Company will pay the Contractor a cancellation or lockout fee as communicated at the time of dispatch. A “lockout” means the Contractor’s reasonable, documented arrival at the scheduled job site at the scheduled time, where the Contractor is unable to gain entry through no fault of the Contractor.",
    ],
  },
  {
    heading: "5. Equipment and Supplies",
    clauses: [
      "5.1  The Contractor will provide, at the Contractor’s sole expense, all equipment, tools, cleaning products, and supplies necessary to perform the Services in accordance with the Company’s service standards. This obligation reflects, and is consistent with, the Contractor’s status as an independent contractor and not an employee.",
      "5.2  The Company may, in its sole discretion, supply or subsidize specific items of equipment or product for select Contractors as a discretionary, non-contractual incentive. Any such subsidy is not an employee benefit, may be modified or discontinued by the Company at any time without notice, and does not alter the Parties’ independent-contractor relationship.",
    ],
  },
  {
    heading: "6. Insurance",
    clauses: [
      "6.1  Required Coverage. As a condition of performing any Services, the Contractor will obtain and maintain at the Contractor’s expense Commercial General Liability insurance with limits not less than the limits maintained by the Company under its general liability policy. Minimum required limits are $1,000,000 per occurrence and $2,000,000 aggregate, matching the Company's own General Liability policy. The Contractor will also maintain Workers’ Compensation and Employer’s Liability insurance to the extent required by New York law for the Contractor’s business operations.",
      "6.2  Endorsements. The Contractor’s Commercial General Liability policy will (i) name Manhattan Mint NYC LLC as additional insured on a primary and non-contributory basis, and (ii) include a waiver of subrogation in favor of Manhattan Mint NYC LLC.",
      "6.3  Certificate. The Contractor will furnish the Company with a Certificate of Insurance evidencing the foregoing coverage prior to performing any Services and within five (5) business days of any renewal, cancellation, non-renewal, or material change.",
      "6.4  Personal Liability for Working Uninsured. If the Contractor performs Services under this Agreement at any time without maintaining the insurance required in Section 6.1—whether because coverage has not yet been obtained, has lapsed, has been cancelled, or for any other reason—the Contractor remains personally and fully liable for all losses, damages, claims, costs, and expenses (including reasonable attorneys’ fees) arising from the Contractor’s Services that would otherwise have been covered by such insurance had it been in place. The Contractor expressly agrees, in the event of any such loss, to use best efforts to make the Company and any affected client whole, including by paying for repair or replacement of damaged property, reimbursing the Company for amounts paid to a third party on account of the Contractor’s actions, and cooperating fully in the investigation and resolution of any claim. The obligations under this Section 6.4 are in addition to, and do not limit or replace, the Contractor’s indemnification obligations under Section 9.",
    ],
  },
  {
    heading: "7. Confidentiality",
    clauses: [
      "7.1  In performing the Services, the Contractor will receive Confidential Information, including without limitation client names, addresses, contact information, access codes, building entry information, scheduling, pricing, and the Company’s business processes. The Contractor will hold all Confidential Information in strict confidence, will use it only to perform the Services, and will not disclose it to any third party. This Section survives termination.",
    ],
  },
  {
    heading: "8. Non-Solicitation",
    clauses: [
      "8.1  During the term of this Agreement and for twelve (12) months after termination, the Contractor will not, directly or indirectly, solicit, divert, accept business from, or perform cleaning services for any client of the Company with whom the Contractor was introduced, assigned, or had contact through the Company, except through and at the direction of the Company. If a court determines that any portion of this Section is overbroad, that portion shall be reformed to the minimum extent necessary to make it enforceable.",
    ],
  },
  {
    heading: "9. Indemnification",
    clauses: [
      "9.1  The Contractor will indemnify, defend, and hold harmless the Company and its members, officers, agents, and affiliates from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising out of or related to (i) the Contractor’s performance or non-performance of Services, (ii) the Contractor’s breach of this Agreement, (iii) the Contractor’s negligent or wrongful acts or omissions, or (iv) any claim that the Contractor was misclassified as an employee. The Contractor’s indemnification obligations are independent of, and not capped by, the insurance required under Section 6.",
    ],
  },
  {
    heading: "10. Term and Termination",
    clauses: [
      "10.1  This Agreement begins on the Effective Date and continues until terminated. Either Party may terminate at any time, with or without cause, on fourteen (14) days’ written notice.",
      "10.2  Notwithstanding Section 10.1, the Company may terminate immediately upon written notice for (i) material breach by the Contractor, (ii) loss or non-renewal of required insurance, (iii) any conduct that, in the Company’s reasonable judgment, creates risk to the safety, property, or reputation of the Company or its clients (including theft, fraud, gross negligence, harassment, or unlawful conduct), or (iv) unsatisfactory background check results.",
      "10.3  Upon termination, the Contractor will (i) cease performing Services, (ii) return or destroy all Confidential Information in the Contractor’s possession, and (iii) be paid for Services accepted and completed prior to termination, less any amounts owed by the Contractor to the Company.",
    ],
  },
  {
    heading: "11. Compliance with Laws",
    clauses: [
      "11.1  The Contractor represents that the Contractor is legally authorized to perform the Services in the United States and will comply with all applicable federal, New York State, and New York City laws and regulations, including without limitation tax, immigration, labor classification, and licensing requirements.",
    ],
  },
  {
    heading: "12. Background Check",
    clauses: [
      "12.1  The Contractor consents to a background check by a third-party vendor (currently Certn or its successor) as a condition of engagement. The Company will pay for the initial check. The Contractor will reasonably cooperate with renewal checks not less than annually. The Company may decline or terminate engagement based on the results, subject to applicable law.",
    ],
  },
  {
    heading: "13. Notices and General Provisions",
    clauses: [
      "13.1  Notices. All notices must be in writing and are deemed given when delivered personally, sent by email to the address most recently provided, or three (3) business days after U.S. mail to the address most recently provided.",
      "13.2  Governing Law and Forum. This Agreement is governed by New York law without regard to conflict-of-laws principles. The Parties consent to the exclusive jurisdiction of the state and federal courts in New York County, New York.",
      "13.3  Entire Agreement; Amendments; Severability. This Agreement is the entire agreement between the Parties and supersedes prior or contemporaneous agreements on its subject matter. It may be amended only in a writing signed by both Parties. If any provision is held invalid, the remainder remains in effect.",
      "13.4  Assignment. The Contractor may not assign this Agreement without the Company’s prior written consent. The Company may assign this Agreement in connection with a sale, merger, or reorganization.",
      "13.5  Counterparts; Electronic Signatures. This Agreement may be executed in counterparts and by electronic signature, each of which is an original and all of which together are one instrument.",
    ],
  },
];

export function agreementIntro(contractorName: string, effectiveDate: string): string {
  return `This Independent Contractor Agreement (the “Agreement”) is entered into as of ${effectiveDate} (the “Effective Date”) between ${COMPANY_NAME}, a New York limited liability company (the “Company”), and ${contractorName} (the “Contractor”).`;
}

/** "November 3, 2026" in New York time. */
export function effectiveDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
}

export type SignedAgreement = {
  contractorName: string;
  address: string;
  email: string;
  phone: string;
  signedAtIso: string;
  signedIp: string;
  cleanerId: string;
};

// ---------------------------------------------------------------------------
// PDF (server only — pdf-lib is imported lazily so the client bundle for
// /sign never pulls it in).
// ---------------------------------------------------------------------------

// pdf-lib's standard fonts only encode WinAnsi; map the few typographic
// characters the text uses onto ASCII so nothing throws mid-render.
function ascii(s: string): string {
  return s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, " - ")
    .replace(/–/g, "-")
    .replace(/§§\s*/g, "Sections ")
    .replace(/§\s*/g, "Section ")
    .replace(/[^\x20-\x7E\n]/g, "");
}

export async function renderSignedAgreementPdf(s: SignedAgreement): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W = 612, PAGE_H = 792, MARGIN = 60, WIDTH = PAGE_W - MARGIN * 2;
  const SIZE = 10, LINE = 14;
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newPage = () => { page = pdf.addPage([PAGE_W, PAGE_H]); y = PAGE_H - MARGIN; };
  const ensure = (lines: number) => { if (y - lines * LINE < MARGIN) newPage(); };

  const wrap = (text: string, f: typeof font, size: number, width: number): string[] => {
    const out: string[] = [];
    for (const para of text.split("\n")) {
      const indent = para.match(/^\s*/)?.[0] ?? "";
      const words = para.trim().split(/\s+/).filter(Boolean);
      let line = indent;
      for (const w of words) {
        const trial = line.trim() ? `${line} ${w}` : `${indent}${w}`;
        if (f.widthOfTextAtSize(trial, size) > width && line.trim()) {
          out.push(line);
          line = `${indent}${w}`;
        } else {
          line = trial;
        }
      }
      out.push(line);
    }
    return out;
  };

  const draw = (text: string, opts: { font?: typeof font; size?: number; gapAfter?: number; color?: [number, number, number] } = {}) => {
    const f = opts.font ?? font, size = opts.size ?? SIZE;
    const lines = wrap(ascii(text), f, size, WIDTH);
    for (const l of lines) {
      ensure(1);
      page.drawText(l, { x: MARGIN, y: y - size, size, font: f, color: rgb(...(opts.color ?? [0.08, 0.08, 0.08])) });
      y -= LINE;
    }
    y -= opts.gapAfter ?? 0;
  };

  const effective = effectiveDateLabel(s.signedAtIso);
  const signedStamp = new Date(s.signedAtIso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "long", timeStyle: "short" }) + " ET";

  draw("INDEPENDENT CONTRACTOR AGREEMENT", { font: bold, size: 15, gapAfter: 2 });
  draw(COMPANY_NAME, { font: bold, size: 11, gapAfter: 10 });
  draw(agreementIntro(s.contractorName, effective), { gapAfter: 8 });

  for (const sec of AGREEMENT_SECTIONS) {
    ensure(3);
    draw(sec.heading, { font: bold, size: 11, gapAfter: 2 });
    for (const c of sec.clauses) draw(c, { gapAfter: 4 });
    y -= 4;
  }

  ensure(14);
  y -= 6;
  draw("IN WITNESS WHEREOF, the Parties execute this Agreement as of the Effective Date.", { gapAfter: 10 });

  draw(COMPANY_NAME.toUpperCase(), { font: bold, size: 10.5, gapAfter: 2 });
  draw(`By: /s/ ${COMPANY_SIGNER}`, {});
  draw(`Name: ${COMPANY_SIGNER}`, {});
  draw(`Title: ${COMPANY_SIGNER_TITLE}`, {});
  draw(`Date: ${effective}`, { gapAfter: 10 });

  ensure(9);
  draw("CONTRACTOR", { font: bold, size: 10.5, gapAfter: 2 });
  draw(`Signature: /s/ ${s.contractorName}`, { font: italic });
  draw(`Print Name: ${s.contractorName}`, {});
  draw(`Address: ${s.address || "-"}`, {});
  draw(`Email: ${s.email}`, {});
  draw(`Phone: ${s.phone}`, {});
  draw(`Date: ${effective}`, { gapAfter: 10 });

  draw(
    `Electronic signature record: signed by ${s.contractorName} on ${signedStamp} from IP ${s.signedIp || "unknown"} via manhattanmintnyc.com/sign (agreement text version ${AGREEMENT_VERSION}, contractor record ${s.cleanerId}). Executed by electronic signature under Section 13.5.`,
    { size: 8, color: [0.35, 0.35, 0.35] },
  );

  return pdf.save();
}
