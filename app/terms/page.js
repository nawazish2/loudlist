import { LegalPage } from "../legal";

export const metadata = { title: "Board rules — LOUDLIST" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="The fine print" title={<>Board<br />rules.</>} updated="23 August 2026">
      <h2>What you are buying</h2>
      <p>A claim on LOUDLIST buys a listing on a public leaderboard, ranked by the amount paid. You are paying for a position on this page and nothing else. There is no advertising guarantee, no traffic guarantee, and no promise about how many people will see your listing.</p>

      <h2>How ranking works</h2>
      <p>Listings are ordered by amount paid, highest first. Ties are broken by whoever paid first. Paying more than an existing listing places you above it and pushes it down. Your rank can and will fall when other people pay more. That is the entire point of the board, and it is not a fault or a reason for a refund.</p>

      <h2>When a claim becomes real</h2>
      <p>A claim appears on the board only after our payment provider confirms the payment. Until that confirmation arrives, the claim is pending and invisible. If a payment fails or is reversed, the listing does not appear or is removed.</p>

      <h2>What you may not list</h2>
      <p>You may not submit content that is illegal, that infringes someone else&apos;s rights, that impersonates another person or business, that promotes malware, fraud, or scams, or that harasses or targets a specific person. Links must resolve to a working page that matches what your listing describes.</p>

      <h2>Removal</h2>
      <p>We may hide or remove any listing that breaks these rules, without notice. We may do this at our discretion, and we may decline to refund a listing removed for a rule breach. If your listing is removed for a reason that is our fault rather than yours, contact us and we will refund it.</p>

      <h2>Refunds</h2>
      <p>Because a listing is published immediately on confirmation, claims are generally non-refundable. If you were charged and your listing never appeared, contact us and we will investigate and refund where the failure was ours.</p>

      <h2>Payments</h2>
      <p>Payments are processed by Dodo Payments. We never see or store your card details. Their terms apply to the payment itself alongside these rules.</p>

      <h2>No guarantees</h2>
      <p>LOUDLIST is provided as-is. The board may be unavailable, may contain listings we have not reviewed, and may change. Listings link to sites we do not control and do not endorse.</p>

      <h2>Changes</h2>
      <p>We may update these rules. Material changes will move the date at the top of this page. Continuing to use the board after a change means you accept the updated rules.</p>
    </LegalPage>
  );
}
