import type { Metadata } from "next";
import { Archivo_Black, Space_Mono, Work_Sans } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const description = "Compile GitHub repositories into deep, structured, LLM-ready context for Claude, GPT, Gemini, Cursor, Codex, and other AI coding assistants.";

const archivoBlack = Archivo_Black({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: "400",
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "GitDoc",
  title: {
    default: "GitDoc | GitHub Repo Context Compiler for AI Assistants",
    template: "%s | GitDoc",
  },
  description,
  keywords: [
    "GitHub context generator",
    "LLM context compiler",
    "AI coding assistant context",
    "Claude repository context",
    "GPT repository context",
    "Cursor context",
    "Codex context",
    "developer tooling",
    "repo documentation",
    "GitHub README analyzer",
  ],
  authors: [{ name: "GitDoc" }],
  creator: "GitDoc",
  publisher: "GitDoc",
  category: "Developer Tools",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "GitDoc",
    title: "GitDoc | GitHub Repo Context Compiler for AI Assistants",
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GitDoc converts GitHub repositories into LLM-ready context.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitDoc | GitHub Repo Context Compiler for AI Assistants",
    description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "geo.region": "US",
    "geo.placename": "United States",
    "ai-crawlable": "true",
    "llms.txt": `${siteUrl}/llms.txt`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "GitDoc",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "GitHub repository context compilation",
      "LLM-ready markdown output",
      "Repository architecture summaries",
      "Technology stack detection",
      "Claude, GPT, Gemini, Cursor, and Codex compatible output",
    ],
  };

  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${workSans.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
