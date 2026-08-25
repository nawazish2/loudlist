import Link from "next/link";

export function LegalPage({ eyebrow, title, updated, children }) {
  return (
    <div className="legal-shell">
      <Link className="brand" href="/"><span className="brand-burst">!</span>LOUDLIST</Link>
      <span className="mini">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="legal-updated">Last updated {updated}</p>
      <div className="legal-body">{children}</div>
      <Link className="claim-mini legal-back" href="/">← Back to the board</Link>
    </div>
  );
}
