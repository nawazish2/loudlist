import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "LOUDLIST — Be impossible to ignore",
  description: "A public attention auction for iPhone and iPad apps.",
  openGraph: {
    title: "LOUDLIST — Be impossible to ignore",
    description: "A public wall of iOS apps. The loudest claim wins, and every claim fades.",
    url: siteUrl,
    siteName: "LOUDLIST",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LOUDLIST — Be impossible to ignore",
    description: "A public wall of iOS apps. The loudest claim wins, and every claim fades.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
