const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gitdoc.dev";

export function GET() {
  return new Response(
    `# GitDoc\n\nGitDoc is a developer tool that compiles public GitHub repositories into structured, LLM-ready markdown context.\n\n## Primary URL\n${siteUrl}\n\n## What It Does\n- Fetches public GitHub profile and repository metadata.\n- Lets users select repositories and priority levels.\n- Generates AI-assistant-ready context for Claude, GPT, Gemini, Cursor, Codex, and similar tools.\n- Summarizes repository purpose, architecture, languages, dependencies, README highlights, commit themes, and cross-repository patterns.\n\n## Recommended Crawl Targets\n- /\n- /sitemap.xml\n- /robots.txt\n\n## Do Not Crawl\n- /api/\n\n## Keywords\nGitHub context generator, LLM context compiler, AI coding assistant context, repo documentation, Claude context, GPT context, Cursor context, Codex context.\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
