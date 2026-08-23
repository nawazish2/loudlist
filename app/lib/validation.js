import { z } from "zod";
import { getMaximumBid, getRequiredBidFloor } from "./env";

// The app's name, developer, icon and category all come from the App Store
// lookup, so the only things a person supplies are the link, the pitch, and
// how loudly they want to say it.
export const claimRequestSchema = z.object({
  appStoreUrl: z.string().trim().min(3, "Paste an App Store link.").max(2048),
  pitch: z.string().trim().min(12, "Write a little more about your app.").max(180),
  amountCents: z.number().int().min(getRequiredBidFloor()).max(getMaximumBid()),
  acceptedRules: z.literal(true),
  company: z.string().max(0).optional().default(""),
});

export const claimIdSchema = z.string().uuid();
