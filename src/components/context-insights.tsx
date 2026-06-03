"use client";

import type { ContextInsights as ContextInsightsType, OverallQualityScore } from "@/types/context";

interface ContextInsightsProps {
  insights: ContextInsightsType | null;
  quality: OverallQualityScore;
  open: boolean;
  onToggle: () => void;
}

function qualityLabel(score: number): "High" | "Medium" | "Low" | "Pending" {
  if (score === 0) return "Pending";
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function ContextInsights({ insights, quality, open, onToggle }: ContextInsightsProps) {
  const techs = insights
    ? [...new Set(Object.values(insights.techStack).flat())].slice(0, 10)
    : [];
  const label = qualityLabel(quality.total);

  return (
    <div className="border-[3px] border-black bg-white px-4 py-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-[var(--font-headline)] text-base uppercase text-black">
          Context Summary
        </span>
        <span className="font-mono text-sm text-black">{open ? "CLOSE" : "OPEN"}</span>
      </button>

      {open && (
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="mb-1 font-mono text-xs uppercase text-black">Quality</div>
            <p className="font-semibold text-black">{label}</p>
          </div>

          <div>
            <div className="mb-1 font-mono text-xs uppercase text-black">Estimated Context</div>
            <p className="font-semibold text-black">
              ~{(insights?.totalTokens ?? 0).toLocaleString()} tokens
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 font-mono text-xs uppercase text-black">Technologies</div>
            <div className="flex flex-wrap gap-1.5">
              {techs.length > 0 ? techs.map((tech) => (
                <span
                  key={tech}
                  className="border-2 border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1px] text-black"
                >
                  {tech}
                </span>
              )) : (
                <span className="text-xs text-black">Build context to detect technologies.</span>
              )}
            </div>
          </div>

          {insights && insights.categories.length > 0 && (
            <div className="md:col-span-2 xl:col-span-4">
              <p className="mb-2 font-mono text-xs uppercase text-black">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.categories.map((category) => (
                  <span key={category} className="border-2 border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1px] text-black">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
