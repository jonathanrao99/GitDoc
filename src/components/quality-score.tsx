"use client";

import type { OverallQualityScore } from "@/types/context";

interface QualityScoreProps {
  score: OverallQualityScore;
}

export function QualityScore({ score }: QualityScoreProps) {
  const color =
    score.total >= 80 ? "text-[#008000]" :
    score.total >= 50 ? "text-[#ffa500]" :
    "text-[#ff0000]";

  const barColor =
    score.total >= 80 ? "bg-emerald-500" :
    score.total >= 50 ? "bg-amber-500" :
    "bg-red-500";

  const factors = [
    { key: "hasReadme" as const, label: "README", weight: 20 },
    { key: "hasTopics" as const, label: "Topics", weight: 10 },
    { key: "hasLicense" as const, label: "License", weight: 10 },
    { key: "hasRecentCommits" as const, label: "Recent Activity", weight: 15 },
    { key: "hasDependencies" as const, label: "Dependencies", weight: 20 },
    { key: "hasDescription" as const, label: "Description", weight: 10 },
  ];

  return (
    <div className="border-[3px] border-black bg-white p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-black">Overall Quality</span>
        <span className={`text-sm font-bold ${color}`}>{score.total}/100</span>
      </div>
      <div className="mb-2.5 h-1.5 w-full bg-[#f0f0f0]">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${score.total}%` }} />
      </div>
      <div className="space-y-1">
        {factors.map((f) => (
          <div key={f.key} className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-black">
              <span className={score.factors[f.key] ? "text-emerald-500" : "text-red-400"}>
                {score.factors[f.key] ? "✓" : "✗"}
              </span>
              {f.label}
            </span>
            <span className={score.factors[f.key] ? "text-[#008000]" : "text-black"}>
              {score.factors[f.key] ? `+${f.weight}` : "0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
