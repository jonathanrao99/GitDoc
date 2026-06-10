function cleanToken(token: string | null | undefined): string | undefined {
  const value = token?.trim();
  return value || undefined;
}

export function getServerGitHubToken(req: Request): string | undefined {
  return (
    cleanToken(process.env.GITHUB_TOKEN) ??
    cleanToken(process.env.GITHUB_API_TOKEN) ??
    cleanToken(req.headers.get("x-github-token"))
  );
}
