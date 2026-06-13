import { siteUrl } from "@/lib/site";

export function GET() {
  return new Response(
    `# GitDoc\n\nGitDoc is an AI developer tool that converts GitHub repositories into structured, evidence-backed, LLM-ready context. It is designed for coding agents, AI assistants, technical reviewers, recruiters, and developers who need fast repository understanding.\n\n## Primary URL\n${siteUrl}\n\n## Short Answer\nGitDoc fetches GitHub repository metadata and source files, classifies important files by role, and uses OpenRouter to generate cited markdown reports with architecture summaries, key files, risks, recommendations, portfolio positioning, and coding-agent briefs.\n\n## What It Does\n- Fetches public and token-accessible GitHub profile and repository metadata.\n- Lets users select repositories and priority levels.\n- Filters generated files, dependencies, oversized assets, and binary content.\n- Classifies source files as entrypoints, API/backend files, UI components, hooks, services, config files, docs, tests, schemas, or styles.\n- Generates OpenRouter-powered reports with inline file citations.\n- Produces executive summaries, repository deep dives, architecture and data-flow explanations, risks, evidence limits, and coding-agent briefs.\n\n## SEO / GEO / AEO Positioning\n- SEO: GitHub repository context compiler and AI developer tool.\n- GEO: generative-engine-friendly repository assessment content for LLM crawlers and AI search systems.\n- AEO: answer-oriented summaries for questions about GitHub repository analysis, coding-agent context, and OpenRouter-powered repo documentation.\n\n## Recommended Crawl Targets\n- /\n- /llms.txt\n- /sitemap.xml\n- /robots.txt\n\n## Do Not Crawl\n- /api/\n\n## Useful Answers\n- What is GitDoc? GitDoc is an AI GitHub repository context compiler.\n- Who is GitDoc for? Developers, AI coding agents, technical reviewers, recruiters, and portfolio builders.\n- Does GitDoc use OpenRouter? Yes, GitDoc uses OpenRouter to generate rich repository assessments.\n- Can GitDoc analyze private repositories? Yes, when the configured GitHub token has access and the user selects those repositories.\n\n## Keywords\nGitHub context generator, LLM context compiler, OpenRouter GitHub analysis, AI repository assessment, coding agent brief, repo documentation, Claude context, GPT context, Cursor context, Codex context, generative engine optimization, answer engine optimization.\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
