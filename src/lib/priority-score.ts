import type { GitHubRepo } from "@/types/github";
import type { Priority } from "@/types/context";

export function calculatePriorityScore(repo: GitHubRepo): number {
  return (
    repo.stargazers_count * 3 +
    (repo.size / 1000) * 0.5 +
    (repo.description ? repo.description.length > 20 ? 10 : 5 : 0) +
    repo.topics.length * 2 +
    (repo.license ? 5 : 0) +
    (repo.fork ? -20 : 0) +
    (repo.archived ? -10 : 0)
  );
}

export function getRecommendedPriority(score: number): Priority {
  if (score >= 40) return "primary";
  if (score >= 10) return "supporting";
  return "archive";
}
