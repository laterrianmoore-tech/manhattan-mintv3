// Mercury (business bank) expenses, read-only (2026-10-09).
//
// The business's non-labor spend goes on the Mercury IO credit card
// (OpenPhone, Netlify, GitHub, Google Workspace, insurance, Facebook ads,
// TaskRabbit trials, Certn checks). The checking account only sees the card's
// autopay and the owner's draws from Stripe. So the P&L on /admin/accounting
// reads card transactions straight from Mercury's API with a read-only token.
// MERCURY_API_TOKEN must be set (Netlify env + .env.local); without it the
// page says so and shows the labor-only numbers.
//
// Never throws: a Mercury outage must not take the ledger down.

export type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // positive = money out, negative = refund/credit
  merchant: string;
  category: string;
  status: string;
};

export type ExpenseReport = {
  configured: boolean;
  ok: boolean;
  error?: string;
  expenses: Expense[];
  /** Month (YYYY-MM) -> total spend */
  byMonth: Record<string, number>;
  /** Month -> category -> spend */
  byMonthCategory: Record<string, Record<string, number>>;
  checkingBalance: number | null;
  cardBalance: number | null;
};

const BASE = "https://api.mercury.com/api/v1";

const CATEGORY_LABEL: Record<string, string> = {
  Software: "Software & tools",
  Advertising: "Advertising",
  Insurance: "Insurance",
  ProfessionalServices: "Hiring & background checks",
};

function label(mercuryCategory: string | null | undefined, merchant: string): string {
  if (/taskrabbit/i.test(merchant)) return "Cleaner trials (TaskRabbit)";
  if (/certn/i.test(merchant)) return "Background checks";
  if (/facebook|facebk|meta/i.test(merchant)) return "Advertising";
  if (mercuryCategory && CATEGORY_LABEL[mercuryCategory]) return CATEGORY_LABEL[mercuryCategory];
  return mercuryCategory || "Other";
}

async function get<T>(path: string, token: string): Promise<T> {
  const r = await fetch(`${BASE}/${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!r.ok) throw new Error(`Mercury ${path}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

export async function mercuryExpenses(sinceYmd: string = "2026-08-01"): Promise<ExpenseReport> {
  const empty: ExpenseReport = { configured: false, ok: false, expenses: [], byMonth: {}, byMonthCategory: {}, checkingBalance: null, cardBalance: null };
  const token = process.env.MERCURY_API_TOKEN;
  if (!token) return empty;
  try {
    type Acct = { id: string; kind?: string; name?: string; currentBalance?: number; availableBalance?: number };
    type Txn = {
      id: string; amount: number; kind: string; status: string; postedAt: string | null; createdAt: string;
      counterpartyName?: string | null; bankDescription?: string | null; mercuryCategory?: string | null;
    };
    const [accounts, credit] = await Promise.all([
      get<{ accounts: Acct[] }>("accounts", token),
      get<{ accounts: Acct[] }>("credit", token),
    ]);
    const checking = accounts.accounts.find((a) => a.kind === "checking");
    const expenses: Expense[] = [];
    let cardBalance: number | null = null;
    for (const c of credit.accounts) {
      cardBalance = (cardBalance ?? 0) + Number(c.currentBalance ?? 0);
      const t = await get<{ transactions: Txn[] }>(`account/${c.id}/transactions?start=${sinceYmd}&limit=500&order=asc`, token);
      for (const x of t.transactions) {
        if (x.status === "failed" || x.status === "cancelled") continue;
        if (x.kind !== "creditCardTransaction" && x.kind !== "creditCardCredit") continue; // skip autopay legs
        const merchant = (x.counterpartyName || x.bankDescription || "Unknown").trim();
        expenses.push({
          id: x.id,
          date: (x.postedAt ?? x.createdAt).slice(0, 10),
          amount: -x.amount, // Mercury signs spend negative; the ledger wants spend positive
          merchant,
          category: label(x.mercuryCategory, merchant),
          status: x.status,
        });
      }
    }
    expenses.sort((a, b) => (a.date < b.date ? -1 : 1));
    const byMonth: Record<string, number> = {};
    const byMonthCategory: Record<string, Record<string, number>> = {};
    for (const e of expenses) {
      const m = e.date.slice(0, 7);
      byMonth[m] = Math.round(((byMonth[m] ?? 0) + e.amount) * 100) / 100;
      byMonthCategory[m] ??= {};
      byMonthCategory[m][e.category] = Math.round(((byMonthCategory[m][e.category] ?? 0) + e.amount) * 100) / 100;
    }
    return {
      configured: true,
      ok: true,
      expenses,
      byMonth,
      byMonthCategory,
      checkingBalance: checking?.currentBalance ?? null,
      cardBalance,
    };
  } catch (e) {
    console.error("[mercury] expenses failed:", (e as Error)?.message);
    return { ...empty, configured: true, error: (e as Error)?.message };
  }
}
