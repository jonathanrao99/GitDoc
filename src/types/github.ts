export interface GitHubProfile {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  license: { spdx_id: string; name: string } | null;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  size: number;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export interface FileNode {
  name: string;
  type: "file" | "dir";
  path: string;
  children?: FileNode[];
}

export interface TechStack {
  [category: string]: string[];
}

export interface DependenciesResult {
  status: "available" | "unavailable";
  reason?: string;
  stack?: TechStack;
}

export interface RepoContext {
  owner: string;
  repo: string;
  metadata: GitHubRepo;
  languages: Record<string, number>;
  readme: string | null;
  commits: GitHubCommit[];
  commitThemes: string[];
  fileTree: FileNode[];
  dependencies: DependenciesResult;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
