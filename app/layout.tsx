import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EPFO Resolve · Independent prototype",
  description: "A synthetic prototype for an EPS correction and PF transfer journey.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
