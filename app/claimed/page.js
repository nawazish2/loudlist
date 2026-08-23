import { Suspense } from "react";
import ClaimResult from "./result";

export const metadata = {
  title: "Your spot on LOUDLIST",
  description: "Your claim on the loud board.",
};

export default function ClaimedPage() {
  return (
    <Suspense fallback={<div className="receipt-shell"><div className="receipt"><span className="mini">Loading</span></div></div>}>
      <ClaimResult />
    </Suspense>
  );
}
