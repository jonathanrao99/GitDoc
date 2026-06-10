import { NextRequest, NextResponse } from "next/server";
import { fetchRepoContext } from "@/lib/github";

const GITHUB_OWNER_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const GITHUB_REPO_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/;
const GITHUB_BRANCH_PATTERN = /^[^\s~^:?*[\\\]]{1,255}$/;

function getGitHubToken(req: Request): string | undefined {
  return req.headers.get("x-github-token") || process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN || undefined;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch") || "main";
    const token = getGitHubToken(req);

    if (!owner || !repo) {
      return NextResponse.json({ error: "owner and repo are required" }, { status: 400 });
    }

    if (!GITHUB_OWNER_PATTERN.test(owner) || !GITHUB_REPO_PATTERN.test(repo) || !GITHUB_BRANCH_PATTERN.test(branch)) {
      return NextResponse.json({ error: "Invalid repository parameters" }, { status: 400 });
    }

    const data = await fetchRepoContext(owner, repo, branch, token);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch repo context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
