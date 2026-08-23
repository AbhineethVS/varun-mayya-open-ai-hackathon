import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "EPFO Resolve · Independent prototype",
  description: "A synthetic prototype for an EPS correction and PF transfer journey.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "EPFO Resolve · Independent prototype",
    description: "A synthetic prototype for an EPS correction and PF transfer journey.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
