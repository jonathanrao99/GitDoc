"use client";

import { useCallback, useState } from "react";
import type { GitHubProfile } from "@/types/github";
import type { RepoWithPriority } from "@/types/context";
import type { AnalysisPurpose, AnalysisRequest, AnalysisResponse, AssessmentStyle } from "@/types/analysis";
import { getAnalysisCache, setAnalysisCache } from "@/lib/analysis-cache";

const ANALYSIS_CACHE_VERSION = "rich-report-v2";

interface AnalyzeOptions {
  profile: GitHubProfile;
  repos: RepoWithPriority[];
  purpose: AnalysisPurpose;
  style: AssessmentStyle;
  includeRecommendations: boolean;
}

interface AiAnalysisState {
  loading: boolean;
  error: string | null;
  result: AnalysisResponse | null;
  cacheHit: boolean;
}

function cacheKey(options: AnalyzeOptions): string {
  const repoKey = options.repos
    .map((item) => `${item.repo.full_name}:${item.repo.pushed_at}:${item.priority}`)
    .sort()
    .join("|");
  return `ai:${ANALYSIS_CACHE_VERSION}:${options.profile.login}:${options.purpose}:${options.style}:${options.includeRecommendations}:${repoKey}`;
}

export function useAiAnalysis() {
  const [state, setState] = useState<AiAnalysisState>({ loading: false, error: null, result: null, cacheHit: false });

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null, cacheHit: false });
  }, []);

  const analyze = useCallback(async (options: AnalyzeOptions) => {
    const key = cacheKey(options);
    setState((current) => ({ ...current, loading: true, error: null, cacheHit: false }));

    try {
      const cached = await getAnalysisCache(key);
      if (cached) {
        setState({ loading: false, error: null, result: cached, cacheHit: true });
        return cached;
      }

      const token = localStorage.getItem("gitdoc:github_token");
      const request: AnalysisRequest = {
        profile: options.profile,
        repos: options.repos.map((item) => ({ repo: item.repo, priority: item.priority })),
        purpose: options.purpose,
        style: options.style,
        includeRecommendations: options.includeRecommendations,
      };

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-github-token": token } : {}),
        },
        body: JSON.stringify(request),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze repositories");

      await setAnalysisCache(key, data as AnalysisResponse);
      setState({ loading: false, error: null, result: data as AnalysisResponse, cacheHit: false });
      return data as AnalysisResponse;
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to analyze repositories",
      }));
      return null;
    }
  }, []);

  return { ...state, analyze, reset };
}
