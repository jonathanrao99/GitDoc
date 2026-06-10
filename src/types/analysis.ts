import type { GitHubProfile, GitHubRepo } from "./github";
import type { Priority } from "./context";

export type AnalysisPurpose = "complete" | "coding-agent" | "portfolio" | "technical-audit" | "recruiter";
export type AssessmentStyle = "balanced" | "presentation" | "critical";

export interface AnalysisRepoInput {
  repo: GitHubRepo;
  priority: Priority;
}

export interface AnalysisRequest {
  profile: GitHubProfile;
  repos: AnalysisRepoInput[];
  purpose: AnalysisPurpose;
  style: AssessmentStyle;
  includeRecommendations: boolean;
}

export interface RepoSourceFile {
  path: string;
  size: number;
  content: string;
  truncated: boolean;
}

export interface RepoAnalysisBundle {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  priority: Priority;
  private: boolean;
  defaultBranch: string;
  files: RepoSourceFile[];
  skipped: {
    binaryOrAsset: number;
    generatedOrDependency: number;
    oversized: number;
    cap: number;
  };
}

export interface AnalysisResponse {
  markdown: string;
  model: string;
  cachedAt: number;
  sourceStats: Array<{
    repo: string;
    filesAnalyzed: number;
    private: boolean;
    skipped: RepoAnalysisBundle["skipped"];
  }>;
}
