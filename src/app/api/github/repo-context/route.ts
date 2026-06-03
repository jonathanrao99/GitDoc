import { NextRequest, NextResponse } from "next/server";
import { fetchRepoContext } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch") || "main";
    const token = req.headers.get("x-github-token") || undefined;

    if (!owner || !repo) {
      return NextResponse.json({ error: "owner and repo are required" }, { status: 400 });
    }

    const data = await fetchRepoContext(owner, repo, branch, token);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch repo context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
