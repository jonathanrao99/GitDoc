# GitDoc

[![Live Site](https://img.shields.io/badge/live-git--docv1.vercel.app-black)](https://git-docv1.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-6f42c1)](https://openrouter.ai)

GitDoc turns GitHub repositories into rich, evidence-backed AI context. Enter a GitHub username, select repositories, and generate structured repository assessments for coding agents, technical reviews, portfolio positioning, recruiter summaries, and LLM-ready markdown.

Live site: https://git-docv1.vercel.app

Repository: https://github.com/jonathanrao99/GitDoc

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=jonathanrao99/GitDoc&type=Date)](https://www.star-history.com/#jonathanrao99/GitDoc&Date)

## What GitDoc Does

- Fetches public and token-accessible GitHub profile and repository metadata.
- Uses a server-side GitHub token for higher API limits and private repository access when available.
- Lets users select repositories and assign priority levels.
- Ingests important source files while filtering generated files, assets, dependencies, and oversized files.
- Classifies files by role, including entrypoints, API routes, components, hooks, services, configs, docs, tests, and schemas.
- Generates OpenRouter-powered repository assessments with file citations.
- Produces coding-agent briefs, architecture summaries, portfolio notes, evidence limits, and optional prioritized recommendations.
- Publishes SEO, GEO, AEO, sitemap, robots, Open Graph, and `llms.txt` metadata.

## SEO, GEO, And AEO

GitDoc is optimized for traditional search engines, generative AI engines, and answer engines.

- SEO: metadata, canonical URL, sitemap, robots rules, Open Graph image, Twitter card, and software application schema.
- GEO: `llms.txt`, AI crawler permissions, structured repository descriptions, and clear crawl targets for generative engines.
- AEO: FAQ structured data, concise answer-oriented copy, direct feature explanations, and evidence-backed positioning for answer engines.

## AI Output

The generated report includes:

- Executive Summary
- Selected Repositories At A Glance
- Repository Deep Dives
- Architecture And Data Flow
- Key Files And Why They Matter
- Strengths
- Risks, Gaps, Or Unknowns
- Best Use For AI/Coding Agents
- Cross-Repository Patterns
- Portfolio / Positioning Notes
- Coding Agent Brief
- Evidence Limits
- Optional Prioritized Recommendations

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- OpenRouter chat completions
- GitHub REST API
- Vercel deployment

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Environment

```bash
NEXT_PUBLIC_SITE_URL=https://git-docv1.vercel.app
GITHUB_TOKEN=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/owl-alpha
```

Set the same values in Vercel project environment variables for production deployments. Keep `GITHUB_TOKEN` and `OPENROUTER_API_KEY` server-only; do not prefix them with `NEXT_PUBLIC_`.

## Scripts

- `npm run dev` starts the local Next.js server.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run build` creates a production build.
- `npm run start` starts the production server.

## Deployment

GitDoc is deployed on Vercel:

https://git-docv1.vercel.app

Deploy from GitHub:

https://github.com/jonathanrao99/GitDoc
