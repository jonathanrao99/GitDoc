"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ContextInsights as ContextInsightsType, OutputFormat, OverallQualityScore, TokenBudget } from "@/types/context";
import { ContextInsights } from "./context-insights";

interface ContextPreviewProps {
  markdown: string;
  tokens: number;
  budget: TokenBudget;
  format: OutputFormat;
  insights: ContextInsightsType | null;
  quality: OverallQualityScore;
  onBudgetChange: (budget: TokenBudget) => void;
  onFormatChange: (format: OutputFormat) => void;
}

function renderPreview(markdown: string) {
  if (!markdown) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-sm text-black">
        <div className="space-y-2 border-[3px] border-black bg-white p-6 text-left font-mono text-black">
          <p>Step 1: Select repositories from the list.</p>
          <p>Step 2: Build LLM Context.</p>
          <p>Step 3: Copy and paste into Claude, GPT, Gemini, Cursor, or Codex.</p>
        </div>
      </div>
    );
  }

  const lines = markdown.split("\n");
  const rendered = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (line.trim() === "**Structure:**") {
      const structureLines: string[] = [];
      let cursor = index + 1;
      while (cursor < lines.length && (lines[cursor].startsWith("  ") || lines[cursor].trim() === "")) {
        if (lines[cursor].trim()) structureLines.push(lines[cursor]);
        cursor++;
      }
      rendered.push(
        <details key={index} className="my-4 border-[3px] border-black bg-white px-4 py-3">
          <summary className="cursor-pointer font-[var(--font-headline)] text-sm uppercase text-black">Structure</summary>
          <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-6 text-black">{structureLines.join("\n")}</pre>
        </details>
      );
      index = cursor - 1;
      continue;
    }

    if (line.startsWith("# ")) {
      rendered.push(<h1 key={index} className="mb-6 mt-1 font-[var(--font-headline)] text-5xl leading-none text-black">{line.slice(2)}</h1>);
      continue;
    }
    if (line.startsWith("## ")) {
      rendered.push(<h2 key={index} className="mb-4 mt-8 font-[var(--font-headline)] text-3xl leading-tight text-black">{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith("### ")) {
      rendered.push(<h3 key={index} className="mb-2 mt-5 text-xl font-semibold text-black">{line.slice(4)}</h3>);
      continue;
    }
    if (line.startsWith("- ")) {
      rendered.push(<p key={index} className="ml-4 text-base leading-7 text-black before:-ml-4 before:mr-2 before:content-['•']">{line.slice(2)}</p>);
      continue;
    }
    if (line.startsWith("> ")) {
      rendered.push(<p key={index} className="mb-3 border-l-[5px] border-black bg-white px-3 py-2 text-base text-black">{line.slice(2)}</p>);
      continue;
    }
    if (line.trim() === "") {
      rendered.push(<div key={index} className="h-2" />);
      continue;
    }

    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
    rendered.push(
      <p key={index} className="text-base leading-7 text-black">
        {boldParts.map((part, partIndex) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={partIndex} className="font-semibold text-black">{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  }

  return rendered;
}

export function ContextPreview({
  markdown,
  tokens,
  insights,
  quality,
}: ContextPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"preview" | "markdown">("preview");
  const [insightsOpen, setInsightsOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!markdown) return;
    previewRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [markdown]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [markdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gitdoc-context.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown]);

  return (
    <section className="flex min-h-[560px] flex-col lg:h-full lg:min-h-0">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="font-[var(--font-headline)] text-3xl leading-none text-black outline-none sm:text-4xl lg:text-3xl">Compiled Context</h2>
          <p className="mt-2 font-mono text-xs text-black">Compiled context ready for Claude, GPT, Gemini, Codex, and Cursor.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full font-mono text-xs text-black sm:w-auto">~{tokens.toLocaleString()} tokens</span>
          <button
            onClick={handleCopy}
            disabled={!markdown}
            className="flex-1 border-[3px] border-black bg-black px-4 py-2 text-sm font-bold uppercase tracking-[2px] text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-[#cccccc] disabled:bg-[#f5f5f5] disabled:text-black sm:flex-none"
          >
            {copied ? "Copied" : "Copy Context"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!markdown}
            className="flex-1 border-[3px] border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-[1px] text-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-[#cccccc] disabled:bg-[#f5f5f5] disabled:text-black sm:flex-none"
          >
            Export
          </button>
        </div>
      </div>

      <div className="mb-4">
        <ContextInsights
          insights={insights}
          quality={quality}
          open={insightsOpen}
          onToggle={() => setInsightsOpen((value) => !value)}
        />
      </div>

      <div className="mb-3 inline-flex w-fit border-[3px] border-black bg-white">
        <button
          onClick={() => setTab("preview")}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-[1px] ${tab === "preview" ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"}`}
        >
          Preview
        </button>
        <button
          onClick={() => setTab("markdown")}
          className={`border-l-[3px] border-black px-3 py-1 text-xs font-bold uppercase tracking-[1px] ${tab === "markdown" ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"}`}
        >
          Markdown
        </button>
      </div>

      <div ref={previewRef} className="min-h-0 flex-1 overflow-y-auto border-[3px] border-black bg-white p-4 sm:p-6">
        {tab === "preview" ? (
          <div className="mx-auto max-w-3xl">{renderPreview(markdown)}</div>
        ) : (
          <pre className="font-mono text-xs leading-relaxed text-black whitespace-pre-wrap">
            {markdown || "Select repositories and click Build LLM Context to generate."}
          </pre>
        )}
      </div>
    </section>
  );
}
