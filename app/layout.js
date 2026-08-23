import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "LOUDLIST — Be impossible to ignore",
  description: "A public attention auction for internet projects, side quests, and hot takes.",
  openGraph: {
    title: "LOUDLIST — Be impossible to ignore",
    description: "A public wall of internet projects. The rank is bought, never bestowed.",
    url: siteUrl,
    siteName: "LOUDLIST",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LOUDLIST — Be impossible to ignore",
    description: "A public wall of internet projects. The rank is bought, never bestowed.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
