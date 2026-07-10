import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Header } from "@/components/layout/header";
import { BetaBanner } from "@/components/layout/beta-banner";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { getAppBaseUrl } from "@/lib/app-url";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "PawPath — Local dog walkers near you",
    template: "%s | PawPath",
  },
  description:
    "Connect with trusted local dog walkers near you. No booking fees, no middleman. Find your neighbor, message directly, pay offline.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PawPath",
    title: "PawPath — Local dog walkers near you",
    description:
      "Connect with trusted local dog walkers near you. No booking fees, no middleman.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PawPath — Local dog walkers near you",
    description:
      "Connect with trusted local dog walkers near you. No booking fees, no middleman.",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f8f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col bg-topo">
            <Header />
            <BetaBanner />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
