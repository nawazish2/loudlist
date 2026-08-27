import { LegalPage } from "../legal";
import { getContactEmail } from "../lib/constants";

export const metadata = { title: "Privacy — LOUDLIST" };

export default function PrivacyPage() {
  const contactEmail = getContactEmail();

  return (
    <LegalPage eyebrow="What we keep" title={<>Privacy.</>} updated="27 August 2026">
      <h2>The short version</h2>
      <p>We keep the listing you chose to publish, and almost nothing else. There are no payments here, so there is no billing data at all. We do not ask you to make an account, we do not run advertising trackers, we do not build profiles, and we do not sell anything about you.</p>

      <h2>What you publish</h2>
      <p>Your pitch and the amount you claim are public by design. That is the product. Do not put anything in those fields you would not want on a public page indefinitely.</p>

      <h2>What we store</h2>
      <p>Alongside your listing we store the App Store link you submitted and the time it was claimed. A public activity log keeps the same shout that appeared on the board. If someone reports a listing, we store that report so a moderator can act on it, and we may forward it to a private moderation inbox we operate.</p>
      <p>To rate-limit claims and reports, we briefly record your IP address against a time window. Those records are deleted automatically after the window expires and are never attached to your listing.</p>

      <h2>The App Store lookup</h2>
      <p>When you submit a link, our server asks Apple&apos;s public iTunes lookup service for that app&apos;s name, developer, icon and category. Only the app&apos;s id is sent — nothing about you goes to Apple, and the request comes from our server, not your browser.</p>
      <p>App icons on the board are loaded directly from Apple&apos;s content network, so displaying a page does mean your browser requests images from Apple. Apple may see your IP address as a result, exactly as it would if you loaded any page with images hosted there.</p>

      <h2>Fonts</h2>
      <p>Typefaces are hosted with the site. Your browser does not request fonts from Google to render this page.</p>

      <h2>What we never collect</h2>
      <p>No card details, no billing address, no payment references — we take no payments, so none of this exists. No email address, no password, no account.</p>

      <h2>Who else is involved</h2>
      <p>Our database and hosting providers store the listing data on our behalf, and process it only to run the service. There is no payment processor involved, because there are no payments.</p>

      <h2>Cookies</h2>
      <p>The site does not set advertising or analytics cookies. Anything stored in your browser is limited to what the page needs to function.</p>

      <h2>How long we keep it</h2>
      <p>Listings stay for as long as the board exists, since a public ranking is a lasting record. Rate-limit records are deleted automatically after their window expires.</p>

      <h2>Your choices</h2>
      <p>You can ask us to hide or remove your listing, or to send you a copy of the data attached to it. Depending on where you live you may have additional rights over your data, and we will honour them.</p>

      <h2>Contact</h2>
      <p>Reach us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a> for anything in this policy.</p>
    </LegalPage>
  );
}
