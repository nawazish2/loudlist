import { Archivo_Black, DM_Mono, Manrope } from "next/font/google";
import { getPublicSiteUrl } from "./lib/constants";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const siteUrl = getPublicSiteUrl();

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
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
