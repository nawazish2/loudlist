import { z } from "zod";
import { getMaximumBid, getRequiredBidFloor } from "./env";
import { claimCategories } from "../data";

export const categories = claimCategories;

function normalizeUrl(value) {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(candidate);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Unsupported protocol");
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

const listingUrl = z.string().trim().min(3).max(2048).superRefine((value, context) => {
  try {
    normalizeUrl(value);
  } catch {
    context.addIssue({ code: "custom", message: "Enter a valid website URL." });
  }
}).transform(normalizeUrl);

export const checkoutRequestSchema = z.object({
  url: listingUrl,
  pitch: z.string().trim().min(12, "Write a little more about your project.").max(180),
  category: z.enum(categories),
  amountCents: z.number().int().min(getRequiredBidFloor()).max(getMaximumBid()),
  acceptedRules: z.literal(true),
  company: z.string().max(0).optional().default(""),
});

export const claimIdSchema = z.string().uuid();
