import { NextResponse } from "next/server";
import { fetchProfile } from "@/lib/github";
import { getServerGitHubToken } from "@/lib/server-github-token";

const GITHUB_OWNER_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const token = getServerGitHubToken(req);
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const normalizedUsername = username.trim();
    if (!GITHUB_OWNER_PATTERN.test(normalizedUsername)) {
      return NextResponse.json({ error: "Invalid GitHub username" }, { status: 400 });
    }

    const data = await fetchProfile(normalizedUsername, token);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
