import { getPublicSiteUrl } from "./lib/constants";

export default function sitemap() {
  const siteUrl = getPublicSiteUrl();
  return [
    { url: siteUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
