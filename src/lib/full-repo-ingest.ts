import type { AnalysisRepoInput, RepoAnalysisBundle, RepoMap, RepoSourceFile } from "@/types/analysis";

const GITHUB_API = "https://api.github.com";

const MAX_REPOS = 6;
const MAX_FILES_PER_REPO = 120;
const MAX_CHARS_PER_FILE = 20_000;
const MAX_CHARS_PER_REPO = 180_000;
const MAX_TOTAL_CHARS = 520_000;

const COMMON_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "GitDoc/1.0",
};

interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  size?: number;
  url: string;
}

interface GitBlob {
  content: string;
  encoding: "base64" | string;
  size: number;
}

function getHeaders(token?: string): Record<string, string> {
  const headers = { ...COMMON_HEADERS };
  const githubToken = token?.trim();
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }
  return headers;
}

async function githubFetch<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      throw new Error("GitHub API error 401: Bad credentials. Check GITHUB_TOKEN in .env.local/Vercel or clear the optional browser token in Settings.");
    }
    throw new Error(`GitHub API error ${res.status}: ${text.slice(0, 220)}`);
  }
  return res.json();
}

function githubUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, GITHUB_API);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);
  return url.toString();
}

function segment(value: string): string {
  return encodeURIComponent(value);
}

function isGeneratedOrDependency(path: string): boolean {
  const lower = path.toLowerCase();
  return /(^|\/)(node_modules|vendor|dist|build|coverage|\.next|\.nuxt|\.git|\.venv|venv|env|__pycache__|\.pytest_cache|\.mypy_cache|target|out|\.turbo|\.cache)(\/|$)/.test(lower)
    || /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|poetry\.lock|pipfile\.lock|cargo\.lock|composer\.lock)$/i.test(lower)
    || /(^|\/)(minified|generated)(\/|$)/.test(lower)
    || /\.min\.(js|css)$/i.test(lower);
}

function isBinaryOrAsset(path: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|ico|svg|pdf|zip|gz|tar|rar|7z|mp4|mov|webm|mp3|wav|woff2?|ttf|eot|otf|sqlite|db|pkl|h5|onnx|pt|pth|bin|exe|dll|dmg|iso|csv|xlsx?|parquet)$/i.test(path);
}

function scorePath(path: string): number {
  let score = 0;
  const lower = path.toLowerCase();
  if (/(readme|license|contributing|architecture|docs?\/)/i.test(path)) score += 18;
  if (/(package\.json|requirements.*\.txt|pyproject\.toml|go\.mod|cargo\.toml|composer\.json|dockerfile|vercel\.json|next\.config|tailwind\.config|tsconfig\.json)$/i.test(path)) score += 22;
  if (/(^|\/)(app|src|pages|components|lib|server|api|routes|controllers|services|models|schemas|hooks|utils|scripts|tests?|__tests__)(\/|$)/i.test(path)) score += 16;
  if (/\.(ts|tsx|js|jsx|py|go|rs|java|cs|cpp|c|h|sql|md|json|toml|yaml|yml|css|html)$/i.test(path)) score += 8;
  if (/(test|spec|e2e)/i.test(path)) score += 8;
  if (lower.split("/").length <= 2) score += 4;
  return score;
}

function fileRole(path: string): string {
  if (/(readme|contributing|docs?\/|\.md$)/i.test(path)) return "docs";
  if (/(package\.json|requirements.*\.txt|pyproject\.toml|go\.mod|cargo\.toml|composer\.json|dockerfile|vercel\.json|next\.config|tailwind\.config|tsconfig\.json|eslint|postcss|\.env\.example)$/i.test(path)) return "config/dependencies";
  if (/(^|\/)(app|pages)\/.*(page|layout|route)\.(ts|tsx|js|jsx)$/i.test(path) || /(^|\/)(main|index|app)\.(ts|tsx|js|jsx|py|go|rs)$/i.test(path)) return "entrypoint";
  if (/(^|\/)(api|routes|controllers|server)(\/|$)|\/route\.(ts|js)$/i.test(path)) return "api/backend";
  if (/(^|\/)(components|ui)(\/|$)|\.(tsx|jsx)$/i.test(path)) return "ui/component";
  if (/(^|\/)(hooks)(\/|$)/i.test(path)) return "client state/hook";
  if (/(^|\/)(lib|utils|services)(\/|$)/i.test(path)) return "core logic/service";
  if (/(test|spec|__tests__|e2e)/i.test(path)) return "test";
  if (/(^|\/)(models|schemas|types)(\/|$)/i.test(path)) return "types/schema";
  if (/\.(css|scss|sass)$/i.test(path)) return "styles";
  return "source";
}

function uniqueSorted(values: string[], limit: number): string[] {
  return [...new Set(values)].sort().slice(0, limit);
}

function repoMap(items: GitTreeItem[]): RepoMap {
  const paths = items.filter((item) => item.type === "blob").map((item) => item.path);
  const directories = uniqueSorted(
    paths.flatMap((path) => {
      const parts = path.split("/");
      return parts.length > 1 ? [parts[0], parts.slice(0, 2).join("/")] : [];
    }),
    30
  );

  return {
    directories,
    entrypoints: uniqueSorted(paths.filter((path) => fileRole(path) === "entrypoint"), 20),
    apiFiles: uniqueSorted(paths.filter((path) => fileRole(path) === "api/backend"), 25),
    componentFiles: uniqueSorted(paths.filter((path) => fileRole(path) === "ui/component"), 25),
    configFiles: uniqueSorted(paths.filter((path) => fileRole(path) === "config/dependencies"), 25),
    testFiles: uniqueSorted(paths.filter((path) => fileRole(path) === "test"), 25),
    docFiles: uniqueSorted(paths.filter((path) => fileRole(path) === "docs"), 20),
  };
}

function decodeBlob(blob: GitBlob): string {
  if (blob.encoding !== "base64") return "";
  return Buffer.from(blob.content.replace(/\n/g, ""), "base64").toString("utf-8");
}

async function fetchBlob(owner: string, repo: string, sha: string, token?: string): Promise<RepoSourceFile["content"]> {
  const blob = await githubFetch<GitBlob>(githubUrl(`/repos/${segment(owner)}/${segment(repo)}/git/blobs/${segment(sha)}`), token);
  return decodeBlob(blob);
}

export async function ingestFullRepos(inputs: AnalysisRepoInput[], token?: string): Promise<RepoAnalysisBundle[]> {
  const bundles: RepoAnalysisBundle[] = [];
  let totalChars = 0;

  for (const input of inputs.slice(0, MAX_REPOS)) {
    const repo = input.repo;
    const [owner, name] = repo.full_name.split("/");
    const tree = await githubFetch<{ tree: GitTreeItem[]; truncated: boolean }>(
      githubUrl(`/repos/${segment(owner)}/${segment(name)}/git/trees/${segment(repo.default_branch || "main")}`, { recursive: "1" }),
      token
    );

    const skipped = { binaryOrAsset: 0, generatedOrDependency: 0, oversized: 0, cap: 0 };
    const candidates = tree.tree
      .filter((item) => item.type === "blob")
      .filter((item) => {
        if (isGeneratedOrDependency(item.path)) {
          skipped.generatedOrDependency++;
          return false;
        }
        if (isBinaryOrAsset(item.path)) {
          skipped.binaryOrAsset++;
          return false;
        }
        if ((item.size ?? 0) > 250_000) {
          skipped.oversized++;
          return false;
        }
        return true;
      })
      .sort((a, b) => scorePath(b.path) - scorePath(a.path));

    const selected = candidates.slice(0, MAX_FILES_PER_REPO);
    skipped.cap += Math.max(0, candidates.length - selected.length);

    const files: RepoSourceFile[] = [];
    let repoChars = 0;
    for (const item of selected) {
      if (totalChars >= MAX_TOTAL_CHARS || repoChars >= MAX_CHARS_PER_REPO) {
        skipped.cap++;
        continue;
      }

      try {
        const raw = await fetchBlob(owner, name, item.sha, token);
        const content = raw.slice(0, MAX_CHARS_PER_FILE);
        const remainingRepo = MAX_CHARS_PER_REPO - repoChars;
        const remainingTotal = MAX_TOTAL_CHARS - totalChars;
        const allowed = Math.max(0, Math.min(content.length, remainingRepo, remainingTotal));
        if (allowed === 0) {
          skipped.cap++;
          continue;
        }

        files.push({
          path: item.path,
          role: fileRole(item.path),
          size: item.size ?? raw.length,
          content: content.slice(0, allowed),
          truncated: raw.length > allowed || raw.length > MAX_CHARS_PER_FILE,
        });
        repoChars += allowed;
        totalChars += allowed;
      } catch {
        skipped.cap++;
      }
    }

    bundles.push({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      topics: repo.topics,
      priority: input.priority,
      private: Boolean(repo.private),
      defaultBranch: repo.default_branch,
      homepage: repo.homepage,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      license: repo.license?.spdx_id ?? repo.license?.name ?? null,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      repoMap: repoMap(tree.tree),
      files,
      skipped,
    });
  }

  return bundles;
}
