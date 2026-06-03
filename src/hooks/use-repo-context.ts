"use client";

import { useState, useCallback } from "react";
import type { RepoContext, GitHubRepo } from "@/types/github";

interface RepoContextState {
  loading: boolean;
  error: string | null;
  contexts: Map<number, RepoContext>;
}

export function useRepoContext() {
  const [state, setState] = useState<RepoContextState>({
    loading: false,
    error: null,
    contexts: new Map(),
  });

  const fetchContexts = useCallback(async (repos: GitHubRepo[]) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const contexts = new Map<number, RepoContext>();

    try {
      const token = localStorage.getItem("gitdoc:github_token");
      const results = await Promise.allSettled(
        repos.map(async (repo) => {
          const [owner, name] = repo.full_name.split("/");
          const branch = repo.default_branch || "main";
          const params = new URLSearchParams({ owner, repo: name, branch });
          const res = await fetch(`/api/github/repo-context?${params}`, {
            headers: token ? { "x-github-token": token } : {},
          });
          if (!res.ok) throw new Error(`Failed to fetch ${name}`);
          const data: RepoContext = await res.json();
          return { id: repo.id, context: data };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          contexts.set(result.value.id, result.value.context);
        }
      }

      setState({ loading: false, error: null, contexts });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch repo details",
      }));
    }
  }, []);

  return { ...state, fetchContexts };
}
