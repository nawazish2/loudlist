import { Suspense } from "react";
import { getClaim } from "../lib/db";
import { isDatabaseConfigured } from "../lib/env";
import ClaimResult from "./result";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const claimId = typeof params?.claim === "string" ? params.claim : "";
  const fallback = {
    title: "Your spot on LOUDLIST",
    description: "Your claim on the loud board.",
    robots: { index: false, follow: false },
  };
  if (!claimId || !isDatabaseConfigured()) return fallback;

  try {
    const claim = await getClaim(claimId);
    if (!claim || claim.hidden) return fallback;
    return {
      title: `#${claim.rank} — ${claim.name} on LOUDLIST`,
      description: claim.pitch,
      robots: { index: false, follow: false },
    };
  } catch {
    return fallback;
  }
}

export default function ClaimedPage() {
  return (
    <Suspense fallback={<div className="receipt-shell"><div className="receipt"><span className="mini">Loading</span></div></div>}>
      <ClaimResult />
    </Suspense>
  );
}
