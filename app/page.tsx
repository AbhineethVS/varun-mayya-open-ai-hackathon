import Link from "next/link";
import { ArrowRight, CheckCircle2, Languages, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="landing-shell">
      <nav className="top-nav"><div className="brand"><span className="brand-mark">R</span><span>EPFO Resolve</span></div><span className="prototype-label">Independent hackathon prototype</span></nav>
      <section className="hero">
        <div className="eyebrow">A clearer route through a stuck PF transfer</div>
        <h1>Know what is wrong.<br /><em>Know who must act.</em></h1>
        <p className="hero-copy">EPFO Resolve guides a fictional employee through an incorrect EPS record, an unresponsive former employer, and a blocked PF transfer—without losing the case history.</p>
        <div className="hero-actions"><Link className="button primary" href="/demo">Start the synthetic demo <ArrowRight size={18} /></Link><a className="button secondary" href="#how-it-works">How it works</a></div>
        <p className="safety-note"><ShieldCheck size={17} /> No real UAN, OTP, passbook, bank, Aadhaar, or employer data is requested.</p>
      </section>
      <section id="how-it-works" className="landing-grid">
        <article><span className="number">01</span><h2>Understand the mismatch</h2><p>See the exact conflicting EPS fields and the source supporting the fictional diagnosis.</p></article>
        <article><span className="number">02</span><h2>Keep one complete case</h2><p>Evidence, deadlines, ownership and every event remain in a single audit trail.</p></article>
        <article><span className="number">03</span><h2>See money reconciled</h2><p>A passbook-style explanation shows why a reclassification is not missing money.</p></article>
      </section>
      <section className="disclosure-strip"><Languages size={19} /> Available in English, Hindi, Bengali, Gujarati, Kannada, Marathi, Tamil and Telugu. <CheckCircle2 size={19} /> All accounts, records, amounts and outcomes are synthetic.</section>
    </main>
  );
}
