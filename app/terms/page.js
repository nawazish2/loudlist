import { LegalPage } from "../legal";

export const metadata = { title: "Board rules — LOUDLIST" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="The fine print" title={<>Board<br />rules.</>} updated="25 August 2026">
      <h2>iOS apps only</h2>
      <p>This board lists iPhone and iPad apps and nothing else. A listing is created from an App Store link, and the app&apos;s name, developer, icon and category are taken from the App Store rather than typed in. Mac-only apps, and anything on Apple&apos;s store that is not an app, are refused.</p>

      <h2>Nobody pays anything</h2>
      <p>LOUDLIST is free. The dollar amounts on this board are play money — a number you pick, not a sum you are charged. We do not take payments, we do not ask for card details, and there is nothing to refund. If any site or message asks you to pay for a spot on LOUDLIST, it is not us.</p>

      <h2>How ranking works</h2>
      <p>Listings are ordered by their current loudness, highest first. Ties are broken by whichever app claimed first. Claiming a bigger number than an existing listing places you above it and pushes it down. Your rank can and will fall when other people claim louder. That is the entire point of the board.</p>

      <h2>One listing per app</h2>
      <p>Each app holds a single spot. Claiming an app that is already on the board replaces its listing — which is also how you defend a spot as it fades — but only if your number is genuinely louder than that listing is right now. A quieter claim is refused, so nobody can knock an app down by re-claiming it cheaply.</p>
      <p>Anyone can claim any app. We do not verify that you built it. Listing an app you do not own is allowed and is part of how the board works, but the rules below on impersonation and misleading content still apply.</p>

      <h2>Everything fades</h2>
      <p>A claim loses half its loudness every twenty-four hours. This happens to every listing, automatically and without exception, so nobody holds the top of the board by getting there first. If you want to stay up there, come back and claim again.</p>

      <h2>What you may not list</h2>
      <p>You may not submit a pitch that is illegal, that infringes someone else&apos;s rights, that impersonates another person or business, that promotes malware, fraud, or scams, or that harasses or targets a specific person. The pitch is the one part of a listing you write, so it is the part you are responsible for — it must describe the app honestly.</p>

      <h2>App Store content</h2>
      <p>App names, developer names, icons and categories belong to their respective developers and are shown here as published on the App Store. LOUDLIST is not affiliated with, endorsed by, or sponsored by Apple. If you are a developer and want your app off the board, email us at the address on the <a href="/privacy">privacy page</a> and we will remove it.</p>

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
