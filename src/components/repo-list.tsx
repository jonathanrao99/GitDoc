"use client";

import { useState, useMemo } from "react";
import type { GitHubRepo } from "@/types/github";
import type { Priority, RepoWithPriority, RepoQualityScore } from "@/types/context";
import { RepoCard } from "./repo-card";
import { calculatePriorityScore, getRecommendedPriority } from "@/lib/priority-score";

interface RepoListProps {
  repos: GitHubRepo[];
  qualityScores: Map<number, RepoQualityScore>;
  onSelectionChange: (selected: RepoWithPriority[]) => void;
  onGenerate: (selected: RepoWithPriority[]) => void;
  loadingContext: boolean;
}

function recommendedScore(repo: GitHubRepo): number {
  const updatedDaysAgo = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
  return (
    (repo.fork ? -40 : 0) +
    (repo.archived ? -60 : 0) +
    (repo.description ? 18 : 0) +
    Math.min(repo.topics.length * 4, 24) +
    Math.min(repo.stargazers_count * 2, 20) +
    Math.max(0, 30 - updatedDaysAgo / 10)
  );
}

export function RepoList({ repos, qualityScores, onSelectionChange, onGenerate, loadingContext }: RepoListProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<Map<number, Priority>>(new Map());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recommended" | "stars" | "updated" | "name" | "quality">("recommended");

  const computedPriorities = useMemo(() => {
    const map = new Map<number, Priority>();
    for (const repo of repos) {
      map.set(repo.id, getRecommendedPriority(calculatePriorityScore(repo)));
    }
    return map;
  }, [repos]);

  const filtered = useMemo(() => {
    let list = [...repos];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.language?.toLowerCase().includes(q) ||
          r.topics.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "recommended") {
      list.sort((a, b) => recommendedScore(b) - recommendedScore(a));
    } else if (sort === "stars") list.sort((a, b) => b.stargazers_count - a.stargazers_count);
    else if (sort === "updated") list.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "quality") {
      list.sort((a, b) => {
        const qa = qualityScores.get(a.id)?.total ?? 0;
        const qb = qualityScores.get(b.id)?.total ?? 0;
        return qb - qa;
      });
    }
    return list;
  }, [repos, search, sort, qualityScores]);

  const toggleRepo = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handlePriorityChange = (id: number, priority: Priority) => {
    const next = new Map(overrides);
    next.set(id, priority);
    setOverrides(next);
  };

  const selectedReposWithPriority: RepoWithPriority[] = useMemo(() => {
    return repos
      .filter((r) => selected.has(r.id))
      .map((r) => {
        const override = overrides.get(r.id);
        const priority = override ?? computedPriorities.get(r.id) ?? "supporting";
        return { repo: r, context: null, priority };
      });
  }, [repos, selected, overrides, computedPriorities]);

  const estimatedTokens = selected.size * 450;

  const selectAll = () => {
    setSelected(new Set(repos.filter((r) => !r.fork && !r.archived).map((r) => r.id)));
  };

  const clearAll = () => setSelected(new Set());

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-[var(--font-headline)] text-[22px] uppercase leading-none text-black">
          Repositories
        </h2>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs uppercase tracking-[1px] text-black underline hover:text-[#0000ff]">
            Select All
          </button>
          <button onClick={clearAll} className="text-xs uppercase tracking-[1px] text-black underline hover:text-[#0000ff]">
            Clear
          </button>
        </div>
      </div>

      <div className="mb-2.5 flex flex-col gap-1.5 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter repos..."
          className="min-w-0 flex-1 border-[3px] border-black bg-[#f0f0f0] px-3 py-2 font-mono text-[15px] text-black placeholder:text-black hover:bg-[#e8e8e8] focus:border-[5px] focus:outline-none"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="w-full border-[3px] border-black bg-white px-2 py-2 font-mono text-xs uppercase text-black focus:border-[5px] focus:outline-none sm:w-auto"
        >
          <option value="recommended">Recommended</option>
          <option value="quality">Quality</option>
          <option value="stars">Stars</option>
          <option value="updated">Recent</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto border-t-[3px] border-black pr-1">
        {filtered.map((repo) => (
          <RepoCard
            key={repo.id}
            repo={repo}
            selected={selected.has(repo.id)}
            priority={overrides.get(repo.id) ?? computedPriorities.get(repo.id) ?? "supporting"}
            qualityScore={qualityScores.get(repo.id) ?? null}
            onToggle={toggleRepo}
            onPriorityChange={handlePriorityChange}
          />
        ))}
      </div>

      <div className="mt-3 border-t-[3px] border-black pt-3">
        <div className="mb-2 min-h-8">
          {selected.size > 0 ? (
            <div className="font-mono text-xs text-black">
              <p>{selected.size} repositories selected</p>
              <p>~{estimatedTokens.toLocaleString()} estimated tokens</p>
            </div>
          ) : (
            <p className="font-mono text-xs text-black">Select repositories to build context.</p>
          )}
        </div>
        <button
          onClick={() => {
            onSelectionChange(selectedReposWithPriority);
            onGenerate(selectedReposWithPriority);
          }}
          disabled={selected.size === 0 || loadingContext}
          className="w-full border-[3px] border-black bg-black px-4 py-3 text-sm font-bold uppercase tracking-[2px] text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-[#cccccc] disabled:bg-[#f5f5f5] disabled:text-black"
        >
          {loadingContext ? "Building Context..." : "Build LLM Context"}
        </button>
      </div>
    </div>
  );
}
