import { z } from "zod";
import { BID_FLOOR_CENTS, getMaximumBidCents } from "./constants";

export const claimRequestSchema = z.object({
  appStoreUrl: z.string().trim().min(3, "Paste an App Store link.").max(2048),
  pitch: z.string().trim().min(12, "Write a little more about your app.").max(180),
  amountCents: z.number().int().min(BID_FLOOR_CENTS).max(getMaximumBidCents()),
  acceptedRules: z.literal(true),
  company: z.string().max(0).optional().default(""),
});

export const claimIdSchema = z.string().uuid();

export const reportRequestSchema = z.object({
  claimId: claimIdSchema,
  reason: z.string().trim().min(12, "Say a little more about why you are reporting this.").max(280),
});
