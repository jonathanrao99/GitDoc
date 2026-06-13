import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GitDoc",
    short_name: "GitDoc",
    description: "AI GitHub repository context compiler for coding agents and LLM-ready assessments.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    categories: ["developer", "productivity", "utilities", "ai"],
    icons: [
      {
        src: `${siteUrl}/icon`,
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
