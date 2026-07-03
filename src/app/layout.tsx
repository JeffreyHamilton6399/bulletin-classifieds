import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bulletin-classifieds.vercel.app"),
  title: {
    default: "Bulletin — local classifieds",
    template: "%s · Bulletin",
  },
  description:
    "A local classifieds marketplace. Browse and post listings across your region — for sale, housing, jobs, services, gigs, and community. No account required.",
  keywords: [
    "classifieds", "marketplace", "listings", "local", "craigslist",
    "for sale", "housing", "jobs", "services", "community",
  ],
  authors: [{ name: "Bulletin" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Bulletin — local classifieds",
    description:
      "Browse and post listings across your region. No account required — post anonymously with email relay.",
    siteName: "Bulletin",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bulletin — local classifieds",
    description: "Local classifieds, scoped by region. Dense, fast, considered.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interTight.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <SonnerToaster position="bottom-right" richColors={false} closeButton />
      </body>
    </html>
  );
}
