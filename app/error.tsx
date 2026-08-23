"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return <main className="recovery-shell"><div className="recovery-card"><span className="eyebrow">EPFO Resolve · prototype recovery</span><h1>We could not open this synthetic step.</h1><p>No real information is involved. Try the journey again; if the problem remains, return to the landing page and start a fresh fictional case.</p><div className="recovery-actions"><button className="button primary" onClick={reset}>Try again</button><Link className="button secondary" href="/">Return home</Link></div></div></main>;
}
