"use client";

import type { TokenBudget } from "@/types/context";

interface TokenBudgetSelectorProps {
  value: TokenBudget;
  onChange: (budget: TokenBudget) => void;
}

const OPTIONS: Array<{ value: TokenBudget; label: string }> = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "deep-dive", label: "Deep Dive" },
];

export function TokenBudgetSelector({ value, onChange }: TokenBudgetSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`border-2 border-black px-2 py-1 text-[10px] font-bold uppercase tracking-[1px] ${
            value === opt.value
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-black hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
