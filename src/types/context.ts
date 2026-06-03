import type { GitHubProfile, GitHubRepo, RepoContext, TechStack } from "./github";

export type TokenBudget = "compact" | "standard" | "deep-dive";
export type OutputFormat = "claude" | "resume" | "coding";
export type Priority = "primary" | "supporting" | "archive";

export interface RepoWithPriority {
  repo: GitHubRepo;
  context: RepoContext | null;
  priority: Priority;
}

export interface GenerationOptions {
  repos: RepoWithPriority[];
  profile: GitHubProfile;
  budget: TokenBudget;
  format: OutputFormat;
}

export interface FactorBreakdown {
  readme: number;
  description: number;
  topics: number;
  license: number;
  dependencies: number;
  commits: number;
}

export interface RepoQualityScore {
  total: number;
  breakdown: FactorBreakdown;
  max: number;
}

export interface OverallQualityScore {
  total: number;
  factors: {
    hasReadme: boolean;
    hasTopics: boolean;
    hasLicense: boolean;
    hasRecentCommits: boolean;
    hasDependencies: boolean;
    hasDescription: boolean;
  };
}

export interface ContextInsights {
  techStack: TechStack;
  totalTokens: number;
  categories: string[];
  healthSummary: {
    high: number;
    medium: number;
    low: number;
  };
  perRepoQuality: Map<number, RepoQualityScore>;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  used: number;
  reset: number;
}
