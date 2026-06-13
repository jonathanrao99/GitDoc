import type { Metadata } from "next";
import { Archivo_Black, Space_Mono, Work_Sans } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const title = "GitDoc | AI GitHub Repository Context Compiler";
const description = "Generate OpenRouter-powered GitHub repository assessments, coding-agent briefs, architecture summaries, and LLM-ready markdown with file citations.";

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
    "OpenRouter GitHub analysis",
    "AI repository assessment",
    "AI coding assistant context",
    "coding agent brief",
    "repository architecture analysis",
    "answer engine optimization",
    "generative engine optimization",
    "Claude repository context",
    "GPT repository context",
    "Cursor context",
    "Codex context",
    "developer tooling",
    "repo documentation",
    "GitHub README analyzer",
    "technical portfolio analysis",
  ],
  authors: [{ name: "GitDoc", url: siteUrl }],
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
    title,
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
    title,
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
    "geo.position": "37.0902;-95.7129",
    "ICBM": "37.0902, -95.7129",
    "ai-crawlable": "true",
    "answer-engine-optimized": "true",
    "generative-engine-optimized": "true",
    "content-purpose": "AI repository assessment, GitHub context generation, coding agent briefing",
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
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "GitDoc",
        url: siteUrl,
        description,
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/?username={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: "GitDoc",
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "AI Developer Tool",
        operatingSystem: "Web",
        url: siteUrl,
        description,
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "OpenRouter-powered GitHub repository assessment",
          "LLM-ready markdown output",
          "Coding-agent context briefs",
          "Repository architecture and data-flow summaries",
          "File citation based analysis",
          "SEO, GEO, AEO, sitemap, robots, and llms.txt metadata",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "What does GitDoc do?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "GitDoc analyzes selected GitHub repositories and generates evidence-backed AI context, architecture summaries, coding-agent briefs, and LLM-ready markdown with file citations.",
            },
          },
          {
            "@type": "Question",
            name: "Does GitDoc use OpenRouter?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. GitDoc uses OpenRouter chat completions to produce rich repository assessments from selected source files and metadata.",
            },
          },
          {
            "@type": "Question",
            name: "Can GitDoc analyze private repositories?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "GitDoc can analyze repositories accessible to the configured GitHub token. Private repository contents may be sent to OpenRouter when selected for AI analysis.",
            },
          },
        ],
      },
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
