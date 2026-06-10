import type { AnalysisRepoInput, RepoAnalysisBundle, RepoSourceFile } from "@/types/analysis";

const GITHUB_API = "https://api.github.com";

const MAX_REPOS = 6;
const MAX_FILES_PER_REPO = 120;
const MAX_CHARS_PER_FILE = 20_000;
const MAX_CHARS_PER_REPO = 180_000;
const MAX_TOTAL_CHARS = 520_000;

const COMMON_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github.v3+json",
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
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubFetch<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) {
    const text = await res.text();
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
      files,
      skipped,
    });
  }

  return bundles;
}
