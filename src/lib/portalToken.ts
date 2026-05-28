import { randomBytes } from "crypto";

export function generatePortalToken(): string {
  return randomBytes(16).toString("hex");
}
