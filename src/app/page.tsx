"use client";

import { useState, useCallback, useMemo } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useRepoContext } from "@/hooks/use-repo-context";
import { UsernameInput } from "@/components/username-input";
import { RepoList } from "@/components/repo-list";
import { ContextPreview } from "@/components/context-preview";
import { TokenBudgetSelector } from "@/components/token-budget-selector";
import { OutputFormatSelector } from "@/components/output-format-selector";
import { generateContext } from "@/lib/context-generator";
import { calculateOverallQuality, calculateRepoQuality, qualityLevel } from "@/lib/quality-score";
import type { RepoWithPriority, TokenBudget, OutputFormat, OverallQualityScore, RepoQualityScore, ContextInsights as ContextInsightsType } from "@/types/context";
import type { RepoContext } from "@/types/github";

export default function Home() {
  const { loading, error, profile, repos, fetchProfile, reset } = useProfile();
  const { loading: loadingContext, contexts, fetchContexts } = useRepoContext();

  const [selectedRepos, setSelectedRepos] = useState<RepoWithPriority[]>([]);
  const [budget, setBudget] = useState<TokenBudget>("standard");
  const [format, setFormat] = useState<OutputFormat>("claude");
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleTokenSave = () => {
    if (tokenInput && tokenInput !== "*".repeat(tokenInput.length)) {
      localStorage.setItem("gitdoc:github_token", tokenInput);
    }
    setShowTokenInput(false);
  };

  const handleGenerate = useCallback(async (repos: RepoWithPriority[]) => {
    setSelectedRepos(repos);
    const reposToFetch = repos.map((r) => r.repo);
    if (reposToFetch.length === 0) return;
    await fetchContexts(reposToFetch);
  }, [fetchContexts]);

  const handleSelectionChange = useCallback((repos: RepoWithPriority[]) => {
    setSelectedRepos(repos);
  }, []);

  const reposWithContext = useMemo(() => {
    return selectedRepos
      .map((rp) => ({ ...rp, context: contexts.get(rp.repo.id) ?? null }))
      .filter((r): r is typeof r & { context: RepoContext } => r.context !== null);
  }, [selectedRepos, contexts]);

  const qualityScores = useMemo(() => {
    const map = new Map<number, RepoQualityScore>();
    for (const r of repos) {
      const ctx = contexts.get(r.id);
      map.set(r.id, ctx ? calculateRepoQuality(ctx) : { total: 0, breakdown: { readme: 0, description: 0, topics: 0, license: 0, dependencies: 0, commits: 0 }, max: 85 });
    }
    return map;
  }, [repos, contexts]);

  const overallQuality = useMemo(() => {
    if (reposWithContext.length === 0) {
      return { total: 0, factors: { hasReadme: false, hasTopics: false, hasLicense: false, hasRecentCommits: false, hasDependencies: false, hasDescription: false } } as OverallQualityScore;
    }
    return calculateOverallQuality(reposWithContext.map((r) => r.context));
  }, [reposWithContext]);

  const generationResult = useMemo(() => {
    if (reposWithContext.length === 0 || !profile) return null;
    return generateContext(profile, reposWithContext, budget, format);
  }, [profile, reposWithContext, budget, format]);

  const insights = useMemo((): ContextInsightsType | null => {
    if (reposWithContext.length === 0) return null;

    const techStack: Record<string, string[]> = {};
    for (const r of reposWithContext) {
      if (r.context.dependencies.status === "available" && r.context.dependencies.stack) {
        for (const [cat, techs] of Object.entries(r.context.dependencies.stack)) {
          if (!techStack[cat]) techStack[cat] = [];
          for (const t of techs) {
            if (!techStack[cat].includes(t)) techStack[cat].push(t);
          }
        }
      }
    }

    const allTopics = new Set<string>();
    for (const r of reposWithContext) {
      for (const t of r.context.metadata.topics) allTopics.add(t);
    }

    const perRepoQuality = new Map<number, RepoQualityScore>();
    for (const r of reposWithContext) {
      perRepoQuality.set(r.repo.id, calculateRepoQuality(r.context));
    }

    const healthSummary = { high: 0, medium: 0, low: 0 };
    for (const score of perRepoQuality.values()) {
      const level = qualityLevel(score.total);
      healthSummary[level]++;
    }

    return {
      techStack,
      totalTokens: generationResult?.tokens ?? 0,
      categories: [...allTopics].filter((t) => !t.match(/^(nextjs|react|typescript|python|javascript|css|html)$/i)).slice(0, 8),
      healthSummary,
      perRepoQuality,
    };
  }, [reposWithContext, generationResult?.tokens]);

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="border-b-[5px] border-black bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between md:py-6">
          <div>
            <h1 className="font-[var(--font-headline)] text-3xl leading-none text-black sm:text-4xl">GitDoc</h1>
            <p className="mt-2 font-mono text-sm text-black">Compile repositories into LLM-ready context</p>
          </div>
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="w-full border-[3px] border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-[2px] text-black hover:bg-black hover:text-white md:w-auto"
            title="Settings"
          >
            Settings
          </button>
        </div>
        {showTokenInput && (
          <div className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6">
            <div className="ml-auto max-w-md space-y-5 border-[3px] border-black bg-white p-4 max-sm:max-w-none">
              <div>
                <p className="mb-2 font-[var(--font-headline)] text-sm uppercase text-black">Context settings</p>
                <div className="space-y-2">
                  <TokenBudgetSelector value={budget} onChange={setBudget} />
                  <OutputFormatSelector value={format} onChange={setFormat} />
                </div>
              </div>

              <div>
                <p className="mb-2 font-[var(--font-headline)] text-sm uppercase text-black">GitHub token</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_..."
                    className="min-w-0 flex-1 border-[3px] border-black bg-[#f0f0f0] px-3 py-2 font-mono text-xs text-black outline-none focus:border-[5px]"
                  />
                  <button
                    onClick={handleTokenSave}
                    className="border-[3px] border-black bg-black px-3 py-2 text-xs font-bold uppercase tracking-[1px] text-white hover:bg-white hover:text-black"
                  >
                    Save
                  </button>
                </div>
                <p className="mt-2 font-mono text-[11px] text-black">Stored locally. Used only to raise GitHub API limits.</p>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {!profile ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-8 max-w-xl text-center">
              <h2 className="mb-4 font-[var(--font-headline)] text-4xl leading-none text-black sm:text-5xl lg:text-6xl">
                Turn GitHub repos into LLM-ready context
              </h2>
              <p className="text-lg leading-8 text-black">
                Enter a GitHub username, select repositories, and generate structured markdown you can paste into Claude, GPT, or any AI assistant.
              </p>
            </div>
            <UsernameInput onFetch={fetchProfile} loading={loading} error={error} />
          </div>
        ) : (
          <div className="flex flex-1 flex-col bg-white lg:max-h-[calc(100vh-113px)] lg:flex-row lg:overflow-hidden">
            <div className="flex min-h-[520px] w-full flex-col overflow-hidden border-b-[5px] border-black px-4 py-5 sm:px-5 lg:min-h-0 lg:w-[34%] lg:min-w-[320px] lg:max-w-[440px] lg:border-b-0 lg:border-r-[5px]">
              <div className="mb-5 flex shrink-0 items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatar_url} alt={profile.login} className="h-8 w-8 rounded-full" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-black">
                    {profile.name || profile.login}
                  </p>
                  <p className="font-mono text-xs text-black">
                    @{profile.login}
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="ml-auto shrink-0 text-xs uppercase tracking-[1px] text-black underline hover:text-[#0000ff]"
                >
                  Change
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <RepoList
                  repos={repos}
                  qualityScores={qualityScores}
                  onSelectionChange={handleSelectionChange}
                  onGenerate={handleGenerate}
                  loadingContext={loadingContext}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:overflow-y-auto lg:px-7 lg:py-6">
              <ContextPreview
                markdown={generationResult?.markdown ?? ""}
                tokens={generationResult?.tokens ?? 0}
                insights={insights}
                quality={overallQuality}
                budget={budget}
                format={format}
                onBudgetChange={setBudget}
                onFormatChange={setFormat}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
