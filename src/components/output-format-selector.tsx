"use client";

import type { OutputFormat } from "@/types/context";

interface OutputFormatSelectorProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
}

const OPTIONS: Array<{ value: OutputFormat; label: string }> = [
  { value: "claude", label: "Claude" },
  { value: "resume", label: "Resume" },
  { value: "coding", label: "Code" },
];

export function OutputFormatSelector({ value, onChange }: OutputFormatSelectorProps) {
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
