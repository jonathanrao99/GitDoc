import { NextResponse } from "next/server";
import { fetchProfile } from "@/lib/github";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const token = req.headers.get("x-github-token") || undefined;
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const data = await fetchProfile(username.trim(), token);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
