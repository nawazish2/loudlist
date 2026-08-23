import { LegalPage } from "../legal";

export const metadata = { title: "Board rules — LOUDLIST" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="The fine print" title={<>Board<br />rules.</>} updated="23 August 2026">
      <h2>Nobody pays anything</h2>
      <p>LOUDLIST is free. The dollar amounts on this board are play money — a number you pick, not a sum you are charged. We do not take payments, we do not ask for card details, and there is nothing to refund. If any site or message asks you to pay for a spot on LOUDLIST, it is not us.</p>

      <h2>How ranking works</h2>
      <p>Listings are ordered by their current loudness, highest first. Ties are broken by whoever claimed first. Claiming a bigger number than an existing listing places you above it and pushes it down. Your rank can and will fall when other people claim louder. That is the entire point of the board.</p>

      <h2>Everything fades</h2>
      <p>A claim loses half its loudness every twenty-four hours. This happens to every listing, automatically and without exception, so nobody holds the top of the board by getting there first. If you want to stay up there, come back and claim again.</p>

      <h2>What you may not list</h2>
      <p>You may not submit content that is illegal, that infringes someone else&apos;s rights, that impersonates another person or business, that promotes malware, fraud, or scams, or that harasses or targets a specific person. Links must resolve to a working page that matches what your listing describes.</p>

      <h2>Removal</h2>
      <p>We may hide or remove any listing that breaks these rules, without notice and at our discretion. Because nothing was paid, nothing is owed either way.</p>

      <h2>Fair use of the board</h2>
      <p>Claiming is rate-limited to keep one person from flooding the board. Do not automate claims, and do not try to work around the limit. We may block access that does.</p>

      <h2>No guarantees</h2>
      <p>LOUDLIST is provided as-is, for fun. The board may be unavailable, may contain listings we have not reviewed, and may change or be reset. Listings link to sites we do not control and do not endorse. There is no advertising guarantee, no traffic guarantee, and no promise about how many people will see your listing.</p>

      <h2>Changes</h2>
      <p>We may update these rules. Material changes will move the date at the top of this page. Continuing to use the board after a change means you accept the updated rules.</p>
    </LegalPage>
  );
}
