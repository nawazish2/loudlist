export function LegalPage({ eyebrow, title, updated, children }) {
  return (
    <div className="legal-shell">
      <a className="brand" href="/"><span className="brand-burst">!</span>LOUDLIST</a>
      <span className="mini">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="legal-updated">Last updated {updated}</p>
      <div className="legal-body">{children}</div>
      <a className="claim-mini legal-back" href="/">← Back to the board</a>
    </div>
  );
}
