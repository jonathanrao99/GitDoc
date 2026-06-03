"use client";

import { useState, type FormEvent } from "react";

interface UsernameInputProps {
  onFetch: (username: string) => void;
  loading: boolean;
  error: string | null;
}

export function UsernameInput({ onFetch, loading, error }: UsernameInputProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim()) onFetch(username.trim());
  };

  return (
    <div className="mx-auto mb-8 w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter GitHub username..."
            className="w-full border-[3px] border-black bg-[#f0f0f0] px-3 py-2.5 font-mono text-[15px] text-black placeholder:text-black hover:bg-[#e8e8e8] focus:border-[5px] focus:outline-none"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="border-[3px] border-black bg-black px-6 py-2.5 text-sm font-bold uppercase tracking-[2px] text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-[#cccccc] disabled:bg-[#f5f5f5] disabled:text-black"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading
            </span>
          ) : (
            "Fetch Repos"
          )}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-[#ff0000]">{error}</p>
      )}
    </div>
  );
}
