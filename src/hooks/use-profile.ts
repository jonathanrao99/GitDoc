"use client";

import { useState, useCallback } from "react";
import type { GitHubProfile, GitHubRepo } from "@/types/github";

interface ProfileState {
  loading: boolean;
  error: string | null;
  profile: GitHubProfile | null;
  repos: GitHubRepo[];
}

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    loading: false,
    error: null,
    profile: null,
    repos: [],
  });

  const fetchProfile = useCallback(async (username: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const token = localStorage.getItem("gitdoc:github_token");
      const res = await fetch("/api/github/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-github-token": token } : {}),
        },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
      setState({ loading: false, error: null, profile: data.profile, repos: data.repos });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Something went wrong",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, profile: null, repos: [] });
  }, []);

  return { ...state, fetchProfile, reset };
}
