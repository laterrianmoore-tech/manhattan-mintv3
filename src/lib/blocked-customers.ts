import { createHash } from "node:crypto";

// ── Blocked customers (owner 2026-11-25) ─────────────────────────────────────
// People the owner no longer wants to book. The online booking form refuses
// them with a neutral "please contact us" message, and no one is notified.
// Stored as SHA-256 of the normalized value so no contact details sit in the
// repo. To add someone, run in a node shell:
//   import("./src/lib/blocked-customers.ts").then(m => console.log(m.blockKeys({ email, phone, address })))
// and paste the hashes into BLOCKED below with a dated comment.

const BLOCKED = new Set<string>([
  // T. Gibson, 300 E 71st St (owner 2026-11-25): email, phone, street address
  "8920f330236a6dd23f0cbd651e897ea75f946dad14a52d338aaabf1e0a3ea67e",
  "7293d693d0b6942179f4fda104a5479078ab67dc6fdaba1c4d926f97e76391d6",
  "4d8e05b68004918a35d2d3ed8e1827b8987163b93685036311486cf63f1ab517",
]);

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export function normEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

/** Last 10 digits, so +1 (323) 205-5001 and 3232055001 match. */
export function normPhone(phone?: string | null) {
  return (phone || "").replace(/\D/g, "").slice(-10);
}

/** Building number + street, abbreviations folded: "300 East 71st Street, 6N" -> "300e71st". */
export function normStreet(address?: string | null) {
  const words = (address || "")
    .toLowerCase()
    .split(",")[0]
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ east: "e", west: "w", north: "n", south: "s", street: "st", avenue: "ave", av: "ave" } as Record<string, string>)[w] ?? w);
  const sfx = words.findIndex((w, i) => i > 0 && (w === "st" || w === "ave"));
  return (sfx > 0 ? words.slice(0, sfx + 1) : words).join("");
}

export function blockKeys(c: { email?: string | null; phone?: string | null; address?: string | null }) {
  return [
    `email:${normEmail(c.email)}`,
    `phone:${normPhone(c.phone)}`,
    `street:${normStreet(c.address)}`,
  ]
    .filter((k) => !k.endsWith(":"))
    .map(sha);
}

export function isBlockedCustomer(c: { email?: string | null; phone?: string | null; address?: string | null }) {
  return blockKeys(c).some((h) => BLOCKED.has(h));
}
