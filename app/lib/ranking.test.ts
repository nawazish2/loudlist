import { describe, expect, it } from "vitest";
import { AppStoreError, extractAppId, parseAppStoreUrl } from "./appstore-url";
import { beatsCurrent, decayedCents } from "./decay";
import { isAllowedClaimOrigin } from "./origin";
import { relativeTime } from "./relative-time";
import { claimRequestSchema } from "./validation";

function request(headers: Record<string, string>, url = "http://localhost:3000/api/claims") {
  return {
    url,
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  };
}

describe("parseAppStoreUrl", () => {
  it("reads the numeric id and storefront country", () => {
    expect(parseAppStoreUrl("https://apps.apple.com/in/app/bear-markdown-notes/id1016366447")).toEqual({
      appId: "1016366447",
      country: "in",
    });
  });

  it("defaults country to us when the path has no storefront", () => {
    expect(parseAppStoreUrl("apps.apple.com/app/id123456789")).toEqual({ appId: "123456789", country: "us" });
  });

  it("rejects non-App-Store hosts", () => {
    expect(() => extractAppId("https://example.com/id123")).toThrow(AppStoreError);
  });
});

describe("decayedCents", () => {
  const claimedAt = Date.parse("2026-01-01T00:00:00.000Z");

  it("is unchanged at claim time", () => {
    expect(decayedCents(9000, claimedAt, claimedAt)).toBe(9000);
  });

  it("halves after one 24-hour half-life", () => {
    expect(decayedCents(9000, claimedAt, claimedAt + 86_400_000)).toBe(4500);
  });

  it("only lets a louder claim beat the live value", () => {
    const now = claimedAt + 86_400_000;
    expect(beatsCurrent(4500, 9000, claimedAt, now)).toBe(false);
    expect(beatsCurrent(4501, 9000, claimedAt, now)).toBe(true);
  });
});

describe("isAllowedClaimOrigin", () => {
  it("rejects cross-site fetch", () => {
    expect(
      isAllowedClaimOrigin(
        request({ "sec-fetch-site": "cross-site", origin: "https://evil.example" }),
        "http://localhost:3000",
      ),
    ).toBe(false);
  });

  it("allows same-origin browser posts", () => {
    expect(
      isAllowedClaimOrigin(
        request({ origin: "http://localhost:3000", "sec-fetch-site": "same-origin" }),
        "http://localhost:3000",
      ),
    ).toBe(true);
  });
});

describe("relativeTime", () => {
  it("labels the first minute as just now", () => {
    expect(relativeTime("2026-01-01T00:00:00.000Z", Date.parse("2026-01-01T00:00:30.000Z"))).toBe("JUST NOW");
  });
});

describe("claimRequestSchema", () => {
  it("rejects a bid below the $1 floor", () => {
    const result = claimRequestSchema.safeParse({
      appStoreUrl: "https://apps.apple.com/us/app/id123456789",
      pitch: "I built something you should install.",
      amountCents: 99,
      acceptedRules: true,
    });
    expect(result.success).toBe(false);
  });
});
