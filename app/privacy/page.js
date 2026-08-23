import { LegalPage } from "../legal";

export const metadata = { title: "Privacy — LOUDLIST" };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="What we keep" title={<>Privacy.</>} updated="23 August 2026">
      <h2>The short version</h2>
      <p>We keep the listing you chose to publish, and the minimum needed to process your payment and stop abuse. We do not run advertising trackers, we do not build profiles, and we do not sell anything about you.</p>

      <h2>What you publish</h2>
      <p>The URL, display name, pitch, category, and amount of your claim are public by design. That is the product. Do not put anything in those fields you would not want on a public page indefinitely.</p>

      <h2>What we store</h2>
      <p>Alongside your listing we store the payment reference returned by our payment provider, the times the claim was created and confirmed, and its status. We temporarily process your IP address to rate-limit checkout attempts and to prevent abuse. We do not store your card details at any point — those go directly to Dodo Payments.</p>

      <h2>Who else is involved</h2>
      <p>Dodo Payments processes payments and is the merchant of record. Our database and hosting providers store the listing data on our behalf. Each of these processes data only to run the service.</p>

      <h2>Cookies</h2>
      <p>The site does not set advertising or analytics cookies. Anything stored in your browser is limited to what the page needs to function.</p>

      <h2>How long we keep it</h2>
      <p>Listings stay for as long as the board exists, since a public ranking is a lasting record. Payment records are kept as long as tax and accounting rules require.</p>

      <h2>Your choices</h2>
      <p>You can ask us to hide or remove your listing, or to send you a copy of the data attached to it. Removal does not automatically refund the claim — see the board rules. Depending on where you live you may have additional rights over your data, and we will honour them.</p>

      <h2>Contact</h2>
      <p>Reach us at the contact address published on this site for anything in this policy.</p>
    </LegalPage>
  );
}
