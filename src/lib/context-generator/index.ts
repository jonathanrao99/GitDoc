import type { GitHubProfile, RepoContext } from "@/types/github";
import type { TokenBudget, OutputFormat, RepoWithPriority } from "@/types/context";
import { estimateTokens } from "@/lib/token-estimator";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

function compactLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function readmeHeadings(readme: string): string[] {
  return readme
    .split("\n")
    .filter((line) => line.match(/^(#{1,3})\s+(.+)/))
    .map((line) => line.replace(/^#{1,3}\s+/, "").trim())
    .filter(Boolean);
}

function readmeHighlights(readme: string, limit: number): string[] {
  const ignored = /^(#{1,6}\s|[-*]\s*$|```|---|\|.*\||!?\[[^\]]*\]\([^)]*\)|npm |pnpm |yarn |pip |python |cd |git clone)/i;
  return readme
    .split("\n")
    .map((line) => compactLine(line.replace(/^[-*]\s+/, "")))
    .filter((line) => line.length >= 35 && !ignored.test(line))
    .slice(0, limit)
    .map((line) => line.slice(0, 260));
}

function topLevelDirectories(repo: RepoContext): string[] {
  return repo.fileTree.filter((node) => node.type === "dir").map((node) => node.name).slice(0, 10);
}

function keyFiles(repo: RepoContext): string[] {
  const importantNames = new Set([
    "package.json",
    "next.config.ts",
    "next.config.js",
    "tailwind.config.ts",
    "tailwind.config.js",
    "tsconfig.json",
    "requirements.txt",
    "pyproject.toml",
    "app.py",
    "main.py",
    "manage.py",
    "Dockerfile",
    "vercel.json",
  ]);

  const files: string[] = [];
  for (const node of repo.fileTree) {
    if (node.type === "file" && importantNames.has(node.name)) files.push(node.name);
    for (const child of node.children ?? []) {
      if (importantNames.has(child.name)) files.push(`${node.name}/${child.name}`);
    }
  }
  return [...new Set(files)].slice(0, 10);
}

function developerSummary(profile: GitHubProfile, repos: Array<RepoWithPriority & { context: RepoContext }>): string {
  const languageCounts = new Map<string, number>();
  const techCounts = new Map<string, number>();
  const focusCounts = new Map<string, number>();

  for (const repo of repos) {
    for (const [language, bytes] of Object.entries(repo.context.languages)) {
      languageCounts.set(language, (languageCounts.get(language) ?? 0) + bytes);
    }
    for (const topic of repo.context.metadata.topics) {
      for (const area of focusAreasFromTopic(topic)) {
        focusCounts.set(area, (focusCounts.get(area) ?? 0) + 1);
      }
    }
    if (repo.context.dependencies.status === "available" && repo.context.dependencies.stack) {
      for (const techs of Object.values(repo.context.dependencies.stack)) {
        for (const tech of techs) {
          techCounts.set(tech, (techCounts.get(tech) ?? 0) + 1);
        }
      }
    }
  }

  const preferredLanguageOrder = new Set(["TypeScript", "Python", "JavaScript", "Go", "Rust", "Java", "C#", "C++", "Swift", "Kotlin", "SQL"]);
  const languages = [...languageCounts.entries()]
    .filter(([language]) => preferredLanguageOrder.has(language) || languageCounts.size <= 3)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([language]) => language);
  const techs = [...techCounts.entries()].sort(([, a], [, b]) => b - a).slice(0, 8).map(([tech]) => tech);
  const focusAreas = [...focusCounts.entries()].sort(([, a], [, b]) => b - a).slice(0, 6).map(([area]) => area);

  const lines: string[] = [`# GitHub Context Report`, "", `## Developer Profile`, ""];
  lines.push(`GitHub Username: ${profile.login}`, "");

  const profileDetails: string[] = [];
  if (profile.name) profileDetails.push(`Name: ${profile.name}`);
  if (profile.bio) profileDetails.push(`Bio: ${profile.bio}`);
  if (profile.location) profileDetails.push(`Location: ${profile.location}`);
  if (profile.company) profileDetails.push(`Company: ${profile.company}`);
  if (profile.blog) profileDetails.push(`Website: ${profile.blog}`);
  profileDetails.push(`Public Repositories: ${profile.public_repos}`);
  profileDetails.push(`GitHub Profile: ${profile.html_url}`);
  lines.push(...profileDetails, "");

  if (languages.length > 0) {
    lines.push(`Primary Languages:`);
    for (const language of languages) lines.push(`- ${language}`);
    lines.push("");
  }

  if (techs.length > 0) {
    lines.push(`Common Technologies:`);
    for (const tech of techs) lines.push(`- ${tech}`);
    lines.push("");
  }

  if (focusAreas.length > 0) {
    lines.push(`Focus Areas:`);
    for (const area of focusAreas) lines.push(`- ${area}`);
    lines.push("");
  }

  return lines.join("\n");
}

function focusAreasFromTopic(topic: string): string[] {
  const t = topic.toLowerCase();
  const areas: string[] = [];
  if (/(ai|artificial-intelligence|machine-learning|tensorflow|lstm|neural|predictive|data-science)/.test(t)) areas.push("AI / ML Systems");
  if (/(analytics|dashboard|business-intelligence|data-visualization|forecasting)/.test(t)) areas.push("Analytics Dashboards");
  if (/(saas|subscription|stripe|billing|starter-template|boilerplate)/.test(t)) areas.push("SaaS Products");
  if (/(landing-page|conference|event-website|restaurant|template|website)/.test(t)) areas.push("Web Templates");
  if (/(developer-tools|cli|automation|workflow|tooling)/.test(t)) areas.push("Developer Tools");
  if (/(full-stack|nextjs|react|app-router|supabase|postgresql)/.test(t)) areas.push("Full-Stack Web Applications");
  if (/(responsive|ui|ux|uiux|modern-ui|framer-motion)/.test(t)) areas.push("UI / UX Systems");
  return areas.length > 0 ? areas : [];
}

function humanizeTag(topic: string): string | null {
  const ignored = new Set(["nextjs", "react", "typescript", "javascript", "python", "html", "css", "tailwindcss", "vercel", "ui", "ux", "uiux"]);
  const t = topic.toLowerCase();
  if (ignored.has(t)) return null;
  if (t.includes("conference")) return "Conference Website";
  if (t.includes("landing-page")) return "Landing Page";
  if (t.includes("restaurant")) return "Restaurant Website";
  if (t.includes("dashboard")) return "Dashboard";
  if (t.includes("analytics")) return "Analytics";
  if (t.includes("machine-learning") || t.includes("artificial-intelligence")) return "AI / ML";
  if (t.includes("template") || t.includes("boilerplate")) return "Template";
  if (t.includes("web-development")) return "Web Development";
  return topic.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function architectureSignals(repo: RepoContext): string[] {
  const paths = new Set(repo.fileTree.map((node) => node.name));
  const childPaths = new Set(repo.fileTree.flatMap((node) => node.children?.map((child) => `${node.name}/${child.name}`) ?? []));
  const signals: string[] = [];

  if (paths.has("app") || childPaths.has("src/app")) signals.push("App Router architecture");
  if (paths.has("components") || childPaths.has("src/components")) signals.push("Component-driven design");
  if (paths.has("lib") || childPaths.has("src/lib")) signals.push("Shared utility layer");
  if (paths.has("public")) signals.push("Static asset management");
  if (paths.has("scripts")) signals.push("Automation scripts");
  if (paths.has("templates")) signals.push("Server-rendered template layer");
  if (paths.has("tests") || childPaths.has("tests/e2e") || childPaths.has("lib/__tests__")) signals.push("Automated testing coverage");
  if (paths.has(".github")) signals.push("GitHub workflow automation");
  if (paths.has("data") || paths.has("data_set")) signals.push("Data-driven application structure");
  if (paths.has("api") || childPaths.has("src/app/api")) signals.push("API route layer");
  if (paths.has("models")) signals.push("Model/data schema layer");
  if (paths.has("static")) signals.push("Static frontend asset layer");

  return [...new Set(signals)].slice(0, 10);
}

function projectIntent(repo: RepoContext): string[] {
  const m = repo.metadata;
  const lines: string[] = [];
  if (m.description) lines.push(`Purpose: ${m.description}`);
  if (m.homepage) lines.push(`Live/demo URL: ${m.homepage}`);
  lines.push(`Default branch: ${m.default_branch}`);
  lines.push(`Created: ${formatDate(m.created_at)} · Last pushed: ${formatDate(m.pushed_at)} · Last updated: ${formatDate(m.updated_at)}`);
  if (m.archived) lines.push("Repository state: archived");
  if (m.fork) lines.push("Repository state: fork");
  return lines;
}

function repoSection(repo: RepoContext, depth: "compact" | "standard" | "deep-dive", format: OutputFormat): string {
  const m = repo.metadata;
  const lines: string[] = [];
  const heading = depth === "compact" ? "###" : "##";

  lines.push(`${heading} ${m.name}`);
  lines.push(``);
  lines.push(`**Repository URL:** ${m.html_url}`);
  if (m.description) lines.push(``, `> ${m.description}`);
  lines.push(``);

  if (depth !== "compact") {
    lines.push(`**Project Context:**`);
    for (const item of projectIntent(repo)) lines.push(`- ${item}`);
    if (format === "resume") lines.push(`- Portfolio relevance: demonstrates shipped project scope, technical stack choices, and maintainable repository documentation.`);
    lines.push(``);
  }

  if (depth !== "compact") {
    const meta: string[] = [];
    if (m.language) meta.push(`**Language:** ${m.language}`);
    meta.push(`**Stars:** ${m.stargazers_count}`, `**Forks:** ${m.forks_count}`, `**Open Issues:** ${m.open_issues_count}`);
    if (m.license) meta.push(`**License:** ${m.license.spdx_id}`);
    lines.push(meta.join(" · "));
    lines.push(``);
  }

  const langEntries = Object.entries(repo.languages);
  if (langEntries.length > 0) {
    const total = Object.values(repo.languages).reduce((a, b) => a + b, 0);
    const breakdown = langEntries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang, bytes]) => `${lang} (${Math.round((bytes / total) * 100)}%)`)
      .join(", ");
    lines.push(`**Languages:** ${breakdown}`);
    lines.push(``);
  }

  if (m.topics.length > 0) {
    const tags = [...new Set(m.topics.map(humanizeTag).filter((tag): tag is string => Boolean(tag)))].slice(0, depth === "deep-dive" ? 10 : 7);
    if (tags.length > 0) {
      lines.push(`**Project Tags:** ${tags.join(", ")}`);
      lines.push(``);
    }
    if (depth === "deep-dive") {
      lines.push(`**GitHub Topics:** ${m.topics.join(", ")}`);
      lines.push(``);
    }
  }

  // Stack — show for standard and deep-dive
  if (repo.dependencies.status === "available" && repo.dependencies.stack) {
    const nonEmptyCats = Object.entries(repo.dependencies.stack).filter(([, techs]) => techs.length > 0);
    if (depth === "deep-dive" || depth === "standard") {
      for (const [category, techs] of nonEmptyCats) {
        lines.push(`**${category}:** ${techs.join(", ")}`);
      }
    } else {
      const uniqueTechs = [...new Set(nonEmptyCats.flatMap(([, techs]) => techs))];
      if (uniqueTechs.length > 0) {
        lines.push(`**Stack:** ${uniqueTechs.join(", ")}`);
      }
    }
    lines.push(``);
  }

  // README summary — standard gets actual highlights, deep-dive gets more.
  if (repo.readme && depth !== "compact") {
    const headings = readmeHeadings(repo.readme);
    if (headings.length > 0) {
      lines.push(`**README Sections:** ${headings.slice(0, depth === "deep-dive" ? 16 : 10).join(" → ")}`);
      lines.push(``);
    }

    const highlights = readmeHighlights(repo.readme, depth === "deep-dive" ? 8 : 4);
    if (highlights.length > 0) {
      lines.push(`**README Highlights:**`);
      for (const highlight of highlights) lines.push(`- ${highlight}`);
      lines.push(``);
    }
  }

  const directories = topLevelDirectories(repo);
  const importantFiles = keyFiles(repo);
  if ((directories.length > 0 || importantFiles.length > 0) && depth !== "compact") {
    lines.push(`**Codebase Map:**`);
    if (directories.length > 0) lines.push(`- Top-level directories: ${directories.join(", ")}`);
    if (importantFiles.length > 0) lines.push(`- Important config/entry files: ${importantFiles.join(", ")}`);
    lines.push(``);
  }

  // Commit themes — include evidence when there is room.
  if (repo.commitThemes.length > 0 && depth !== "compact") {
    lines.push(`**Recent Activity:** ${repo.commitThemes.join(" · ")}`);
    lines.push(``);
  }

  if (repo.commits.length > 0 && depth === "deep-dive") {
    lines.push(`**Recent Commit Evidence:**`);
    for (const commit of repo.commits.slice(0, 8)) {
      const message = commit.commit.message.split("\n")[0];
      lines.push(`- ${formatDate(commit.commit.author.date)}: ${message}`);
    }
    lines.push(``);
  }

  const signals = architectureSignals(repo);
  if (signals.length > 0 && depth !== "compact") {
    lines.push(`**Architecture Signals:**`);
    for (const signal of signals) lines.push(`- ${signal}`);
    lines.push(``);
  }

  // File tree for standard and deep-dive, with deeper expansion in deep-dive.
  if (repo.fileTree.length > 0 && depth !== "compact") {
    lines.push(`**Structure:**`);
    for (const node of repo.fileTree.slice(0, depth === "deep-dive" ? 24 : 12)) {
      if (node.type === "dir") {
        lines.push(`  ${node.name}/`);
        if (node.children) {
          for (const child of node.children.slice(0, depth === "deep-dive" ? 24 : 10)) {
            lines.push(`    ${child.name}`);
          }
        }
      } else {
        lines.push(`  ${node.name}`);
      }
    }
    lines.push(``);
  }

  return lines.join("\n");
}

function crossRepoAnalysis(repos: RepoWithPriority[]): string {
  const sections: string[] = ["## Cross-Repository Analysis", ""];
  const withContext = repos.filter((r): r is typeof r & { context: RepoContext } => r.context !== null);
  if (withContext.length === 0) return sections.join("\n");

  // Shared technologies
  const techCounts = new Map<string, Set<string>>();
  for (const r of withContext) {
    if (r.context.dependencies.status === "available" && r.context.dependencies.stack) {
      for (const techs of Object.values(r.context.dependencies.stack)) {
        for (const t of techs) {
          if (!techCounts.has(t)) techCounts.set(t, new Set());
          techCounts.get(t)!.add(r.context.metadata.name);
        }
      }
    }
  }

  const sharedTechs = [...techCounts.entries()].filter(([, reposSet]) => reposSet.size > 1);
  if (sharedTechs.length > 0) {
    sections.push("**Shared Technologies:**");
    for (const [tech, reposSet] of sharedTechs) {
      sections.push(`- \`${tech}\` used in: ${[...reposSet].join(", ")}`);
    }
    sections.push("");
  }

  // Common languages
  const langs = new Map<string, Set<string>>();
  for (const r of withContext) {
    for (const lang of Object.keys(r.context.languages)) {
      if (!langs.has(lang)) langs.set(lang, new Set());
      langs.get(lang)!.add(r.context.metadata.name);
    }
  }
  if (langs.size > 0) {
    sections.push("**Common Languages:**");
    const sortedLangs = [...langs.entries()].sort(([, a], [, b]) => b.size - a.size);
    for (const [lang, reposSet] of sortedLangs.slice(0, 5)) {
      sections.push(`- \`${lang}\` used in ${reposSet.size} repos`);
    }
    sections.push("");
  }

  const focusCounts = new Map<string, Set<string>>();
  const architectureCounts = new Map<string, Set<string>>();
  for (const r of withContext) {
    for (const topic of r.context.metadata.topics) {
      for (const area of focusAreasFromTopic(topic)) {
        if (!focusCounts.has(area)) focusCounts.set(area, new Set());
        focusCounts.get(area)!.add(r.context.metadata.name);
      }
    }
    for (const signal of architectureSignals(r.context)) {
      if (!architectureCounts.has(signal)) architectureCounts.set(signal, new Set());
      architectureCounts.get(signal)!.add(r.context.metadata.name);
    }
  }

  if (focusCounts.size > 0) {
    sections.push("**Project Focus Themes:**");
    for (const [area, reposSet] of [...focusCounts.entries()].sort(([, a], [, b]) => b.size - a.size).slice(0, 8)) {
      sections.push(`- ${area}: ${[...reposSet].join(", ")}`);
    }
    sections.push("");
  }

  if (architectureCounts.size > 0) {
    sections.push("**Architecture Patterns:**");
    for (const [signal, reposSet] of [...architectureCounts.entries()].sort(([, a], [, b]) => b.size - a.size).slice(0, 8)) {
      sections.push(`- ${signal}: ${[...reposSet].join(", ")}`);
    }
    sections.push("");
  }

  const recentRepos = withContext
    .map((r) => ({ name: r.context.metadata.name, pushedAt: r.context.metadata.pushed_at, themes: r.context.commitThemes }))
    .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())
    .slice(0, 6);
  if (recentRepos.length > 0) {
    sections.push("**Recent Work Signals:**");
    for (const repo of recentRepos) {
      const themes = repo.themes.length > 0 ? ` · ${repo.themes.join(" · ")}` : "";
      sections.push(`- ${repo.name}: last pushed ${formatDate(repo.pushedAt)}${themes}`);
    }
    sections.push("");
  }

  return sections.join("\n");
}

export function generateContext(
  profile: GitHubProfile,
  repos: RepoWithPriority[],
  budget: TokenBudget,
  format: OutputFormat
): { markdown: string; tokens: number } {
  const parts: string[] = [];

  // Format framing
  if (format === "claude") {
    parts.push("# Instructions", "");
    parts.push("You are assisting with development across the following GitHub repositories. Use this context to understand the codebase, architecture, and recent activity.", "");
  } else if (format === "resume") {
    parts.push("# Candidate GitHub Context", "");
    parts.push("This is a summary of the candidate's open source work and technical background based on their public GitHub repositories.", "");
  } else if (format === "coding") {
    parts.push("# Coding Assistant Context", "");
    parts.push("Here is the architecture overview and repository relationships for the following projects.", "");
  }

  const withContext = repos.filter((r): r is typeof r & { context: RepoContext } => r.context !== null);
  parts.push(developerSummary(profile, withContext));

  const primary = withContext.filter((r) => r.priority === "primary");
  const supporting = withContext.filter((r) => r.priority === "supporting");
  const archive = withContext.filter((r) => r.priority === "archive");

  // Overview summary
  parts.push(`## Overview`, "");
  parts.push(`- **Primary Projects:** ${primary.length}`);
  parts.push(`- **Supporting Projects:** ${supporting.length}`);
  if (budget !== "compact") parts.push(`- **Archive:** ${archive.length}`);
  parts.push("");

  // Primary projects
  if (primary.length > 0) {
    parts.push("## Primary Projects", "");
    for (const r of primary) parts.push(repoSection(r.context, budget, format));
  }

  // Supporting projects
  if (supporting.length > 0 && budget !== "compact") {
    parts.push("## Supporting Projects", "");
    for (const r of supporting) parts.push(repoSection(r.context, budget, format));
  }

  // Archive
  if (archive.length > 0 && budget === "deep-dive") {
    parts.push("## Archive", "");
    for (const r of archive) parts.push(repoSection(r.context, "compact", format));
  }

  // Cross-repo analysis
  if (budget !== "compact") {
    parts.push(crossRepoAnalysis(repos));
  }

  const markdown = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const tokens = estimateTokens(markdown);

  return { markdown, tokens };
}
