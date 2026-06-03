import type { GitHubProfile, GitHubRepo, RepoContext, GitHubCommit, FileNode, DependenciesResult } from "@/types/github";
import type { ParsedDep } from "./tech-map";
import { mapDependencies } from "./tech-map";
import { cacheGet, cacheSet } from "./cache";

const GITHUB_API = "https://api.github.com";

const PROFILE_CACHE_TTL = 15 * 60 * 1000;
const CONTEXT_CACHE_TTL = 30 * 60 * 1000;

const COMMON_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "GitDoc/1.0",
};

function getHeaders(token?: string): Record<string, string> {
  const headers = { ...COMMON_HEADERS };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function githubFetch<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchProfile(username: string, token?: string): Promise<{ profile: GitHubProfile; repos: GitHubRepo[] }> {
  const cacheKey = `profile:${token ? "auth" : "public"}:${username}`;
  const cached = cacheGet<{ profile: GitHubProfile; repos: GitHubRepo[] }>(cacheKey);
  if (cached) return cached;

  const [profile, repos] = await Promise.all([
    githubFetch<GitHubProfile>(`${GITHUB_API}/users/${username}`, token),
    githubFetch<GitHubRepo[]>(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&type=all`, token),
  ]);

  const result = { profile, repos: repos.filter((r) => !r.disabled) };
  cacheSet(cacheKey, result, PROFILE_CACHE_TTL);
  return result;
}

async function fetchReadme(owner: string, repo: string, token?: string): Promise<string | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
      headers: { ...getHeaders(token), Accept: "application/vnd.github.v3.raw" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 4000);
  } catch {
    return null;
  }
}

async function fetchCommits(owner: string, repo: string, token?: string): Promise<GitHubCommit[]> {
  try {
    return githubFetch<GitHubCommit[]>(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=10`,
      token
    );
  } catch {
    return [];
  }
}

async function fetchLanguages(owner: string, repo: string, token?: string): Promise<Record<string, number>> {
  try {
    return githubFetch<Record<string, number>>(
      `${GITHUB_API}/repos/${owner}/${repo}/languages`,
      token
    );
  } catch {
    return {};
  }
}

async function fetchFileTree(owner: string, repo: string, branch: string, token?: string): Promise<FileNode[]> {
  try {
    const data = await githubFetch<{ tree: Array<{ path: string; type: string }> }>(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=2`,
      token
    );
    return buildTree(data.tree.map((item) => ({ path: item.path, type: item.type as "blob" | "tree" })));
  } catch {
    return [];
  }
}

function buildTree(items: Array<{ path: string; type: "blob" | "tree" }>): FileNode[] {
  const root: FileNode[] = [];
  for (const item of items) {
    const parts = item.path.split("/");
    if (parts.length === 1) {
      root.push({ name: parts[0], type: item.type === "tree" ? "dir" : "file", path: item.path });
    } else if (parts.length === 2) {
      const existing = root.find((n) => n.name === parts[0] && n.type === "dir");
      if (existing) {
        if (!existing.children) existing.children = [];
        existing.children.push({ name: parts[1], type: item.type === "tree" ? "dir" : "file", path: item.path });
      } else {
        root.push({
          name: parts[0], type: "dir", path: parts[0],
          children: [{ name: parts[1], type: item.type === "tree" ? "dir" : "file", path: item.path }],
        });
      }
    }
  }
  return root;
}

type DepFile = "package.json" | "requirements.txt" | "requirements-ml.txt" | "pyproject.toml" | "Cargo.toml" | "go.mod" | "composer.json";

async function fetchDependencyFile(owner: string, repo: string, branch: string, path: DepFile, token?: string): Promise<Record<string, string> | null> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const res = await fetch(url, { headers: getHeaders(token) });
    if (!res.ok) return null;
    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return parseDependencyFile(path, content);
  } catch {
    return null;
  }
}

function parseDependencyFile(path: DepFile, content: string): Record<string, string> {
  switch (path) {
    case "package.json":
      try {
        const json = JSON.parse(content);
        return { ...json.dependencies, ...json.devDependencies };
      } catch { return {}; }
    case "requirements.txt":
    case "requirements-ml.txt": {
      const deps: Record<string, string> = {};
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("-")) {
          const match = trimmed.match(/^([a-zA-Z0-9_.-]+)([><=!~]+\s*[\w.*-]+)?/);
          if (match) deps[match[1]] = trimmed;
        }
      }
      return deps;
    }
    case "pyproject.toml": {
      const deps: Record<string, string> = {};
      const lines = content.split("\n");
      let inDeps = false;
      for (const line of lines) {
        if (line.trim().match(/^\[(tool\.poetry\.dependencies|project\.dependencies)\]/)) {
          inDeps = true; continue;
        }
        if (inDeps && line.trim().startsWith("[")) break;
        if (inDeps) {
          const match = line.trim().match(/^"?([a-zA-Z0-9_.-]+)"?\s*[=:>]/);
          if (match) deps[match[1]] = match[0];
        }
      }
      return deps;
    }
    case "Cargo.toml": {
      const deps: Record<string, string> = {};
      const lines = content.split("\n");
      let inDeps = false;
      for (const line of lines) {
        if (line.trim() == "[dependencies]") { inDeps = true; continue; }
        if (inDeps && line.trim().startsWith("[")) break;
        if (inDeps) {
          const match = line.trim().match(/^([a-zA-Z0-9_.-]+)\s*=\s*"(.*)"/);
          if (match) deps[match[1]] = match[2];
        }
      }
      return deps;
    }
    case "go.mod": {
      const deps: Record<string, string> = {};
      for (const line of content.split("\n")) {
        const match = line.trim().match(/^\t([a-zA-Z0-9_.\/-]+)\s+v?([0-9]+\.[0-9]+\.[0-9]+)/);
        if (match) deps[match[1]] = match[2];
      }
      return deps;
    }
    case "composer.json":
      try {
        const json = JSON.parse(content);
        return { ...json.require, ...json["require-dev"] };
      } catch { return {}; }
  }
}

async function fetchDependencies(owner: string, repo: string, branch: string, token?: string): Promise<DependenciesResult> {
  const depFiles: DepFile[] = ["package.json", "requirements.txt", "requirements-ml.txt", "pyproject.toml", "Cargo.toml", "go.mod", "composer.json"];
  const parsedDeps: ParsedDep[] = [];

  for (const file of depFiles) {
    const raw = await fetchDependencyFile(owner, repo, branch, file, token);
    if (raw && Object.keys(raw).length > 0) {
      parsedDeps.push({ file, raw });
    }
  }

  if (parsedDeps.length === 0) {
    return { status: "unavailable", reason: "No supported dependency file found" };
  }

  const stack = mapDependencies(parsedDeps);
  return { status: "available", stack };
}

export function summarizeCommits(commits: GitHubCommit[]): string[] {
  if (commits.length === 0) return [];

  const themes = new Map<string, number>();

  for (const c of commits) {
    const msg = c.commit.message.split("\n")[0].toLowerCase();
    const theme = classifyCommit(msg);
    themes.set(theme, (themes.get(theme) || 0) + 1);
  }

  return [...themes.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme.charAt(0).toUpperCase() + theme.slice(1));
}

function classifyCommit(msg: string): string {
  const patterns: [RegExp, string][] = [
    [/^(feat|feature|add|implement|introduce)/, "Feature development"],
    [/^(fix|bugfix|hotfix|patch|resolve)/, "Bug fixes"],
    [/^(refactor|restructure|reorganize|rewrite)/, "Code refactoring"],
    [/^(docs?|readme|documentation|comment)/, "Documentation"],
    [/^(test|spec|coverage)/, "Testing"],
    [/^(chore|maintenance|cleanup|housekeeping)/, "Maintenance"],
    [/^(style|format|lint|prettier)/, "Code style"],
    [/^(perf|performance|optimize)/, "Performance"],
    [/^(ci|cd|deploy|build|release)/, "CI/CD"],
    [/^(deps?|dependency|upgrade|update|bump)/, "Dependency updates"],
    [/^(ui|ux|style|css|tailwind|design)/, "UI/UX"],
    [/^(config|configuration|setup|init)/, "Configuration"],
    [/^(a11y|accessibility)/, "Accessibility"],
    [/^(i18n|l10n|localization|translation)/, "Localization"],
    [/^(security|vuln|cve)/, "Security"],
    [/^(wip|progress|draft)/, "Work in progress"],
    [/^remove|^delete|^drop/, "Cleanup"],
    [/^revert/, "Reversion"],
    [/^merge/, "Merging"],
    [/\b(refactor|restructure|clean)\b/, "Code refactoring"],
    [/\b(fix|bug|issue|error|crash)\b/, "Bug fixes"],
    [/\b(update|improve|enhance|revise|tweak)\b/, "Improvements"],
    [/\b(add|new|feature|implement)\b/, "Feature development"],
    [/\b(docs?|readme|documentation)\b/, "Documentation"],
    [/\b(test|spec)\b/, "Testing"],
  ];

  for (const [pattern, label] of patterns) {
    if (pattern.test(msg)) return label;
  }

  return "General development";
}

export async function fetchRepoContext(owner: string, repo: string, branch: string = "main", token?: string): Promise<RepoContext> {
  const cacheKey = `context:${token ? "auth" : "public"}:${owner}/${repo}`;
  const cached = cacheGet<RepoContext>(cacheKey);
  if (cached) return cached;

  const [metadata, languages, readme, commits, fileTree, dependencies] = await Promise.all([
    githubFetch<GitHubRepo>(`${GITHUB_API}/repos/${owner}/${repo}`, token),
    fetchLanguages(owner, repo, token),
    fetchReadme(owner, repo, token),
    fetchCommits(owner, repo, token),
    fetchFileTree(owner, repo, branch, token),
    fetchDependencies(owner, repo, branch, token),
  ]);

  const commitThemes = summarizeCommits(commits);
  const result: RepoContext = { owner, repo, metadata, languages, readme, commits, commitThemes, fileTree, dependencies };

  cacheSet(cacheKey, result, CONTEXT_CACHE_TTL);
  return result;
}
