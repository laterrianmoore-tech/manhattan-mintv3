import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Independent Contractor Agreement — Manhattan Mint",
  robots: { index: false, follow: false },
};

export default function SignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
