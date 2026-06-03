import type { RepoContext } from "@/types/github";
import type { OverallQualityScore, RepoQualityScore, FactorBreakdown } from "@/types/context";

const WEIGHTS: FactorBreakdown = {
  readme: 20,
  description: 10,
  topics: 10,
  license: 10,
  dependencies: 20,
  commits: 15,
};

const MAX_TOTAL = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

export function calculateOverallQuality(contexts: RepoContext[]): OverallQualityScore {
  const factors = {
    hasReadme: contexts.some((c) => c.readme !== null),
    hasTopics: contexts.some((c) => c.metadata.topics.length > 0),
    hasLicense: contexts.some((c) => c.metadata.license !== null),
    hasRecentCommits: contexts.some((c) => c.commits.length >= 3),
    hasDependencies: contexts.some((c) => c.dependencies.status === "available"),
    hasDescription: contexts.some((c) => c.metadata.description !== null && c.metadata.description.length > 20),
  };

  const total = Math.round(
    (Object.values(factors).filter(Boolean).length / Object.values(factors).length) * 100
  );

  return { total, factors };
}

export function calculateRepoQuality(context: RepoContext): RepoQualityScore {
  const breakdown: FactorBreakdown = {
    readme: context.readme ? WEIGHTS.readme : 0,
    description:
      context.metadata.description && context.metadata.description.length > 20
        ? WEIGHTS.description
        : context.metadata.description
          ? Math.round(WEIGHTS.description * 0.5)
          : 0,
    topics: context.metadata.topics.length >= 3
      ? WEIGHTS.topics
      : context.metadata.topics.length > 0
        ? Math.round(WEIGHTS.topics * 0.5)
        : 0,
    license: context.metadata.license ? WEIGHTS.license : 0,
    dependencies: context.dependencies.status === "available" ? WEIGHTS.dependencies : 0,
    commits: context.commits.length >= 5
      ? WEIGHTS.commits
      : context.commits.length >= 2
        ? Math.round(WEIGHTS.commits * 0.6)
        : context.commits.length > 0
          ? Math.round(WEIGHTS.commits * 0.3)
          : 0,
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total, breakdown, max: MAX_TOTAL };
}

export function qualityLevel(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
