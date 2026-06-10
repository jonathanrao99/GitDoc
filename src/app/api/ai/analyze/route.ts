import { NextRequest, NextResponse } from "next/server";
import type { AnalysisRequest, AnalysisResponse, RepoAnalysisBundle } from "@/types/analysis";
import { ingestFullRepos } from "@/lib/full-repo-ingest";
import { getServerGitHubToken } from "@/lib/server-github-token";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/owl-alpha";

function purposeLabel(purpose: AnalysisRequest["purpose"]): string {
  switch (purpose) {
    case "coding-agent": return "coding-agent context for another AI developer";
    case "portfolio": return "portfolio and personal-brand assessment";
    case "technical-audit": return "technical audit";
    case "recruiter": return "recruiter and hiring-manager evaluation";
    case "complete": return "complete combined report across coding context, portfolio, audit, and recruiter evaluation";
  }
}

function styleInstruction(style: AnalysisRequest["style"]): string {
  switch (style) {
    case "presentation": return "Be presentation-focused: emphasize strengths, positioning, shipped functionality, and clear value. Do not invent facts.";
    case "critical": return "Be critical and evaluative: identify risks, gaps, weak implementation signals, maintainability issues, and evidence-backed concerns. Do not be harsh without evidence.";
    case "balanced": return "Be balanced: explain strengths and limitations with evidence from files. Do not overstate quality beyond what the code supports.";
  }
}

function filePacket(bundle: RepoAnalysisBundle): string {
  const files = bundle.files.map((file) => {
    const fence = file.path.endsWith(".md") ? "markdown" : "text";
    const truncated = file.truncated ? " TRUNCATED" : "";
    return `FILE: ${file.path}\nROLE: ${file.role}\nSIZE: ${file.size} bytes${truncated}\n\`\`\`${fence}\n${file.content}\n\`\`\``;
  }).join("\n\n");

  const map = bundle.repoMap;
  const repoMap = [
    `DIRECTORIES: ${map.directories.join(", ") || "none detected"}`,
    `ENTRYPOINTS: ${map.entrypoints.join(", ") || "none detected"}`,
    `API/BACKEND FILES: ${map.apiFiles.join(", ") || "none detected"}`,
    `COMPONENT FILES: ${map.componentFiles.join(", ") || "none detected"}`,
    `CONFIG/DEPENDENCY FILES: ${map.configFiles.join(", ") || "none detected"}`,
    `TEST FILES: ${map.testFiles.join(", ") || "none detected"}`,
    `DOC FILES: ${map.docFiles.join(", ") || "none detected"}`,
  ].join("\n");

  return [
    `REPOSITORY: ${bundle.fullName}`,
    `URL: ${bundle.url}`,
    `HOMEPAGE: ${bundle.homepage ?? "none"}`,
    `PRIVATE: ${bundle.private ? "yes" : "no"}`,
    `PRIORITY: ${bundle.priority}`,
    `DESCRIPTION: ${bundle.description ?? "none"}`,
    `PRIMARY LANGUAGE: ${bundle.language ?? "unknown"}`,
    `TOPICS: ${bundle.topics.join(", ") || "none"}`,
    `DEFAULT BRANCH: ${bundle.defaultBranch}`,
    `STARS: ${bundle.stars}`,
    `FORKS: ${bundle.forks}`,
    `OPEN ISSUES: ${bundle.openIssues}`,
    `LICENSE: ${bundle.license ?? "none"}`,
    `CREATED: ${bundle.createdAt}`,
    `UPDATED: ${bundle.updatedAt}`,
    `PUSHED: ${bundle.pushedAt}`,
    `FILES ANALYZED: ${bundle.files.length}`,
    `SKIPPED: ${JSON.stringify(bundle.skipped)}`,
    `REPO MAP:\n${repoMap}`,
    files,
  ].join("\n");
}

function buildPrompt(body: AnalysisRequest, bundles: RepoAnalysisBundle[]): string {
  const recommendationInstruction = body.includeRecommendations
    ? "Include a dedicated Recommendations section with prioritized improvements, missing tests, security concerns, architecture improvements, deployment readiness, and portfolio positioning where supported by evidence."
    : "Do not include a dedicated recommendations/improvements section. You may mention limitations only when needed to accurately explain the assessment.";

  return `You are GitDoc's repository assessment engine. Analyze the actual source files below, not only descriptions or READMEs. Produce a practical, evidence-backed markdown report that a developer, recruiter, or coding agent can use immediately.

Developer: ${body.profile.name ?? body.profile.login} (@${body.profile.login})
GitHub profile: ${body.profile.html_url}
Report purpose: ${purposeLabel(body.purpose)}
Assessment style: ${styleInstruction(body.style)}
${recommendationInstruction}

Required behavior:
- Base every major claim on file evidence and cite file paths inline, e.g. \`src/app/page.tsx\`, \`package.json\`, \`README.md\`.
- Prefer concrete implementation details over generic praise. Explain what code exists, how it is wired together, and what is missing.
- Use the repo map and file roles to reason about architecture before discussing raw file contents.
- For each selected repo, explain what the app/system does, how it is implemented, and which files prove that.
- Identify architecture, data flow, UI/backend/API boundaries, dependencies, tests, deployment/configuration, security/privacy considerations, and notable implementation details.
- Include a Cross-Repository Analysis section comparing strengths, repeated patterns, focus areas, and overall positioning.
- If private repos are included, do not expose secrets or claim hidden behavior beyond the provided files.
- If files were skipped/truncated, mention that the assessment is bounded by analyzed files.
- Do not fabricate files, features, metrics, production usage, test coverage, or business impact.

Required report structure:
# GitDoc Repository Assessment

## Executive Summary
- 4-6 bullets describing the strongest evidence-backed conclusions.

## Selected Repositories At A Glance
- Table with repository, purpose, primary stack, evidence files, maturity/readiness, and notable risk.

## Repository Deep Dives
For each repo include:
### <repo name>
#### What It Does
#### Architecture And Data Flow
#### Key Files And Why They Matter
#### Strengths
#### Risks, Gaps, Or Unknowns
#### Best Use For AI/Coding Agents

## Cross-Repository Patterns
## Portfolio / Positioning Notes
## Coding Agent Brief
- Include concise bullets a future coding agent should know before editing this codebase.
${body.includeRecommendations ? "## Prioritized Recommendations\n- Group recommendations by impact and cite the files that justify them." : ""}
## Evidence Limits
- Mention skipped/truncated files and any conclusions that require manual confirmation.

Selected repository source packets:

${bundles.map(filePacket).join("\n\n---\n\n")}`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured on the server." }, { status: 500 });
    }

    const body = (await req.json()) as AnalysisRequest;
    if (!body.profile || !Array.isArray(body.repos) || body.repos.length === 0) {
      return NextResponse.json({ error: "profile and selected repos are required" }, { status: 400 });
    }

    const githubToken = getServerGitHubToken(req);
    const bundles = await ingestFullRepos(body.repos, githubToken);
    const prompt = buildPrompt(body, bundles);
    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "GitDoc",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a senior software architect, technical evaluator, and pragmatic coding-agent context writer. Return only markdown with precise file citations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `OpenRouter error ${response.status}: ${text.slice(0, 400)}` }, { status: 502 });
    }

    const data = await response.json();
    const markdown = data?.choices?.[0]?.message?.content;
    if (typeof markdown !== "string" || markdown.trim().length === 0) {
      return NextResponse.json({ error: "OpenRouter returned an empty analysis." }, { status: 502 });
    }

    const result: AnalysisResponse = {
      markdown: markdown.trim(),
      model,
      cachedAt: Date.now(),
      sourceStats: bundles.map((bundle) => ({
        repo: bundle.fullName,
        filesAnalyzed: bundle.files.length,
        private: bundle.private,
        skipped: bundle.skipped,
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze repositories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
