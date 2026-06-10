import { NextRequest, NextResponse } from "next/server";
import type { AnalysisRequest, AnalysisResponse, RepoAnalysisBundle } from "@/types/analysis";
import { ingestFullRepos } from "@/lib/full-repo-ingest";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/owl-alpha";

function getGitHubToken(req: Request): string | undefined {
  return req.headers.get("x-github-token") || process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN || undefined;
}

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
    return `FILE: ${file.path} (${file.size} bytes${truncated})\n\`\`\`${fence}\n${file.content}\n\`\`\``;
  }).join("\n\n");

  return [
    `REPOSITORY: ${bundle.fullName}`,
    `URL: ${bundle.url}`,
    `PRIVATE: ${bundle.private ? "yes" : "no"}`,
    `PRIORITY: ${bundle.priority}`,
    `DESCRIPTION: ${bundle.description ?? "none"}`,
    `PRIMARY LANGUAGE: ${bundle.language ?? "unknown"}`,
    `TOPICS: ${bundle.topics.join(", ") || "none"}`,
    `DEFAULT BRANCH: ${bundle.defaultBranch}`,
    `FILES ANALYZED: ${bundle.files.length}`,
    `SKIPPED: ${JSON.stringify(bundle.skipped)}`,
    files,
  ].join("\n");
}

function buildPrompt(body: AnalysisRequest, bundles: RepoAnalysisBundle[]): string {
  const recommendationInstruction = body.includeRecommendations
    ? "Include a dedicated Recommendations section with prioritized improvements, missing tests, security concerns, architecture improvements, deployment readiness, and portfolio positioning where supported by evidence."
    : "Do not include a dedicated recommendations/improvements section. You may mention limitations only when needed to accurately explain the assessment.";

  return `You are GitDoc's repository assessment engine. Analyze the actual source files below, not only descriptions or READMEs. Produce a useful markdown report with file citations.\n\nDeveloper: ${body.profile.name ?? body.profile.login} (@${body.profile.login})\nGitHub profile: ${body.profile.html_url}\nReport purpose: ${purposeLabel(body.purpose)}\nAssessment style: ${styleInstruction(body.style)}\n${recommendationInstruction}\n\nRequired behavior:\n- Base claims on file evidence and cite file paths inline, e.g. \`src/app/page.tsx\`, \`package.json\`, \`README.md\`.\n- For each selected repo, explain what the app/system actually does, how it is implemented, and which files prove that.\n- Identify main architecture, data flow, UI/backend/API boundaries, dependencies, tests, deployment/configuration, and notable implementation details.\n- Include a Cross-Repository Analysis section comparing strengths, repeated patterns, focus areas, and overall positioning.\n- If private repos are included, do not expose secrets or claim hidden behavior beyond the provided files.\n- If files were skipped/truncated, mention that the assessment is bounded by analyzed files.\n- Do not fabricate files, features, metrics, or production usage.\n\nSelected repository source packets:\n\n${bundles.map(filePacket).join("\n\n---\n\n")}`;
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

    const githubToken = getGitHubToken(req);
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
            content: "You are a senior software architect and technical evaluator. Return only markdown.",
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
