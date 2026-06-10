# GitDoc

GitDoc compiles public GitHub profiles and repositories into structured, LLM-ready markdown for Claude, GPT, Gemini, Cursor, Codex, and other AI coding assistants.

Live site: https://git-docv1.vercel.app

## Features

- Fetch public GitHub profile and repository metadata.
- Use a server-side GitHub token for higher API limits and accessible private repositories.
- Select repositories and adjust priority levels.
- Generate OpenRouter-powered repository assessments with file citations.
- Estimate token usage and summarize repository quality signals.
- Publish SEO, sitemap, robots, Open Graph, and `llms.txt` metadata.

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

## Deploy

The app is deployed on Vercel from the GitHub repository:

https://github.com/jonathanrao99/GitDoc
