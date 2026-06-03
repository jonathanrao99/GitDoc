"use client";

import type { GitHubRepo } from "@/types/github";
import type { Priority, RepoQualityScore } from "@/types/context";

interface RepoCardProps {
  repo: GitHubRepo;
  selected: boolean;
  priority: Priority;
  qualityScore: RepoQualityScore | null;
  onToggle: (id: number) => void;
  onPriorityChange: (id: number, priority: Priority) => void;
}

function qualityLabel(score: RepoQualityScore | null): "High" | "Medium" | "Low" | "Unknown" {
  if (!score || score.total === 0) return "Unknown";
  if (score.total >= 70) return "High";
  if (score.total >= 40) return "Medium";
  return "Low";
}

export function RepoCard({ repo, selected, priority, qualityScore, onToggle, onPriorityChange }: RepoCardProps) {
  const quality = qualityLabel(qualityScore);
  const hasQuality = qualityScore !== null && qualityScore.total > 0;
  const qualityColor =
    quality === "High" ? "text-[#008000]" :
    quality === "Medium" ? "text-[#ffa500]" :
    quality === "Low" ? "text-[#ff0000]" :
    "text-black";

  return (
    <div
      className={`group relative cursor-pointer border-b-[3px] border-black px-3 py-2 ${
        selected
          ? "bg-black text-white"
          : "bg-white text-black hover:underline"
      }`}
      onClick={() => onToggle(repo.id)}
    >
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggle(repo.id)}
          className={`h-5 w-5 shrink-0 appearance-none border-[3px] focus:border-[5px] focus:outline-none ${
            selected
              ? "border-white bg-black checked:bg-white"
              : "border-black bg-white checked:bg-black"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-medium">
              {repo.name}
            </h3>
          </div>
          <div className={`mt-0.5 flex items-center gap-1.5 text-sm ${selected ? "text-white" : "text-black"}`}>
            {repo.language && <span>{repo.language}</span>}
            {hasQuality && (
              <>
                {repo.language && <span>·</span>}
                <span className="inline-flex items-center gap-1">
                  <span className={selected ? "text-white" : qualityColor}>{quality}</span>
                </span>
              </>
            )}
            {(repo.language || hasQuality) && <span>·</span>}
            <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
          </div>
        </div>

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(repo.id, e.target.value as Priority)}
            className="max-w-7 cursor-pointer border-0 bg-white px-0 py-0.5 text-xs text-black opacity-0 outline-none group-hover:opacity-100 focus:opacity-100"
          >
            <option value="primary">Primary</option>
            <option value="supporting">Supporting</option>
            <option value="archive">Archive</option>
          </select>
        </div>
      </div>
    </div>
  );
}
