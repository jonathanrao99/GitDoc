import type { TechStack } from "@/types/github";

interface TechMapping {
  category: string;
  label: string;
  patterns: RegExp[];
}

const TECH_MAP: TechMapping[] = [
  // ── Frontend Frameworks ──
  { category: "Frontend", label: "Next.js", patterns: [/^next$/] },
  { category: "Frontend", label: "React", patterns: [/^react$/, /^@react\//, /^react-/] },
  { category: "Frontend", label: "Vue.js", patterns: [/^vue$/] },
  { category: "Frontend", label: "Svelte", patterns: [/^svelte$/] },
  { category: "Frontend", label: "Angular", patterns: [/^@angular\//] },
  { category: "Frontend", label: "Nuxt", patterns: [/^nuxt$/] },
  { category: "Frontend", label: "Gatsby", patterns: [/^gatsby$/] },
  { category: "Frontend", label: "Remix", patterns: [/^@remix-run/] },
  { category: "Frontend", label: "Astro", patterns: [/^astro$/] },

  // ── CSS / UI Libraries ──
  { category: "UI", label: "Tailwind CSS", patterns: [/^tailwindcss$/, /^@tailwindcss\//] },
  { category: "UI", label: "Radix UI", patterns: [/^@radix-ui/] },
  { category: "UI", label: "shadcn/ui", patterns: [/^@?shadcn/] },
  { category: "UI", label: "Chakra UI", patterns: [/^@chakra-ui/] },
  { category: "UI", label: "MUI", patterns: [/^@mui/] },
  { category: "UI", label: "Ant Design", patterns: [/^antd$/] },
  { category: "UI", label: "DaisyUI", patterns: [/^daisyui/] },
  { category: "UI", label: "NextUI", patterns: [/^@nextui/] },
  { category: "UI", label: "Lucide", patterns: [/^lucide-react$/] },

  // ── Animation ──
  { category: "Animation", label: "Framer Motion", patterns: [/^framer-motion$/] },
  { category: "Animation", label: "GSAP", patterns: [/^gsap$/] },
  { category: "Animation", label: "Three.js", patterns: [/^three$/] },

  // ── State Management ──
  { category: "State", label: "Zustand", patterns: [/^zustand$/] },
  { category: "State", label: "Redux", patterns: [/^redux$/, /^@reduxjs\//] },
  { category: "State", label: "Jotai", patterns: [/^jotai$/] },
  { category: "State", label: "Valtio", patterns: [/^valtio$/] },

  // ── Data Fetching / Forms ──
  { category: "Data", label: "TanStack Query", patterns: [/^@tanstack\/react-query$/] },
  { category: "Data", label: "SWR", patterns: [/^swr$/] },
  { category: "Data", label: "tRPC", patterns: [/^@trpc/] },
  { category: "Data", label: "Zod", patterns: [/^zod$/] },
  { category: "Data", label: "React Hook Form", patterns: [/^react-hook-form$/] },

  // ── Backend Frameworks ──
  { category: "Backend", label: "Express", patterns: [/^express$/] },
  { category: "Backend", label: "Fastify", patterns: [/^fastify$/] },
  { category: "Backend", label: "NestJS", patterns: [/^@nestjs/] },
  { category: "Backend", label: "Hono", patterns: [/^hono$/] },
  { category: "Backend", label: "Flask", patterns: [/^flask$/] },
  { category: "Backend", label: "Django", patterns: [/^django$/] },
  { category: "Backend", label: "FastAPI", patterns: [/^fastapi$/] },
  { category: "Backend", label: "Rails", patterns: [/^rails$/] },
  { category: "Backend", label: "Spring Boot", patterns: [/^spring-boot/] },
  { category: "Backend", label: "Laravel", patterns: [/^laravel$/] },
  { category: "Backend", label: "Phoenix", patterns: [/^phoenix$/] },

  // ── Rust Backend ──
  { category: "Backend", label: "Actix", patterns: [/^actix/] },
  { category: "Backend", label: "Axum", patterns: [/^axum$/] },
  { category: "Backend", label: "Gin", patterns: [/^gin$/] },
  { category: "Backend", label: "Echo", patterns: [/^echo$/] },
  { category: "Backend", label: "Fiber", patterns: [/^fiber$/] },
  { category: "Backend", label: "Rocket", patterns: [/^rocket$/] },

  // ── BaaS / Backend Services ──
  { category: "Backend", label: "Supabase", patterns: [/^@supabase/] },
  { category: "Backend", label: "Firebase", patterns: [/^firebase/] },

  // ── ORMs / Databases ──
  { category: "Database", label: "Prisma", patterns: [/^@prisma/] },
  { category: "Database", label: "Drizzle", patterns: [/^drizzle-orm$/] },
  { category: "Database", label: "TypeORM", patterns: [/^typeorm$/] },
  { category: "Database", label: "SQLAlchemy", patterns: [/^sqlalchemy$/] },
  { category: "Database", label: "Mongoose", patterns: [/^mongoose$/] },
  { category: "Database", label: "PostgreSQL", patterns: [/^pg$/, /^postgres/, /^psycopg2?$/] },
  { category: "Database", label: "MongoDB", patterns: [/^mongodb$/, /^pymongo$/] },
  { category: "Database", label: "Redis", patterns: [/^redis$/] },
  { category: "Database", label: "SQLite", patterns: [/^sqlite/] },
  { category: "Database", label: "MySQL", patterns: [/^mysql/] },
  { category: "Database", label: "PlanetScale", patterns: [/^@planetscale/] },
  { category: "Database", label: "Neon", patterns: [/^@neondatabase/] },

  // ── AI / ML ──
  { category: "AI", label: "OpenAI", patterns: [/^openai$/] },
  { category: "AI", label: "Anthropic", patterns: [/^@anthropic/] },
  { category: "AI", label: "LangChain", patterns: [/^langchain/] },
  { category: "AI", label: "Hugging Face", patterns: [/^transformers$/] },
  { category: "AI", label: "TensorFlow", patterns: [/^tensorflow$/] },
  { category: "AI", label: "Keras", patterns: [/^keras$/] },
  { category: "AI", label: "PyTorch", patterns: [/^torch$/, /^pytorch$/] },
  { category: "AI", label: "JAX", patterns: [/^jax$/] },
  { category: "AI", label: "Scikit-learn", patterns: [/^scikit-learn$/] },
  { category: "AI", label: "LlamaIndex", patterns: [/^llama-index$/] },
  { category: "AI", label: "Vercel AI SDK", patterns: [/^ai$/] },
  { category: "AI", label: "Ollama", patterns: [/^ollama/] },
  { category: "AI", label: "XGBoost", patterns: [/^xgboost$/] },
  { category: "AI", label: "LightGBM", patterns: [/^lightgbm$/] },
  { category: "AI", label: "spaCy", patterns: [/^spacy$/] },
  { category: "AI", label: "NLTK", patterns: [/^nltk$/] },

  // ── Data Science / Analytics ──
  { category: "Data Science", label: "Pandas", patterns: [/^pandas$/] },
  { category: "Data Science", label: "NumPy", patterns: [/^numpy$/] },
  { category: "Data Science", label: "SciPy", patterns: [/^scipy$/] },
  { category: "Data Science", label: "Matplotlib", patterns: [/^matplotlib$/] },
  { category: "Data Science", label: "Seaborn", patterns: [/^seaborn$/] },
  { category: "Data Science", label: "Plotly", patterns: [/^plotly$/] },
  { category: "Data Science", label: "Bokeh", patterns: [/^bokeh$/] },

  // ── Dashboarding ──
  { category: "Dashboard", label: "Streamlit", patterns: [/^streamlit$/] },
  { category: "Dashboard", label: "Dash", patterns: [/^dash$/] },
  { category: "Dashboard", label: "Grafana", patterns: [/^grafana/] },
  { category: "Dashboard", label: "Gradio", patterns: [/^gradio$/] },

  // ── Charts / Visualization ──
  { category: "Visualization", label: "Chart.js", patterns: [/^chart\.js$/] },
  { category: "Visualization", label: "Recharts", patterns: [/^recharts$/] },
  { category: "Visualization", label: "D3.js", patterns: [/^d3$/] },
  { category: "Visualization", label: "ECharts", patterns: [/^echarts/] },
  { category: "Visualization", label: "ApexCharts", patterns: [/^apexcharts/] },

  // ── Payment ──
  { category: "Payments", label: "Stripe", patterns: [/^stripe$/] },
  { category: "Payments", label: "Lemon Squeezy", patterns: [/^lemonsqueezy/] },
  { category: "Payments", label: "Paddle", patterns: [/^paddle/] },
  { category: "Payments", label: "RevenueCat", patterns: [/^revenuecat/] },

  // ── Email ──
  { category: "Email", label: "Resend", patterns: [/^resend$/] },
  { category: "Email", label: "SendGrid", patterns: [/^@sendgrid/] },
  { category: "Email", label: "Postmark", patterns: [/^postmark/] },
  { category: "Email", label: "Mailgun", patterns: [/^mailgun/] },
  { category: "Email", label: "Nodemailer", patterns: [/^nodemailer$/] },

  // ── Auth ──
  { category: "Auth", label: "Clerk", patterns: [/^@clerk/] },
  { category: "Auth", label: "Auth.js", patterns: [/^next-auth/] },
  { category: "Auth", label: "Lucia", patterns: [/^lucia$/] },
  { category: "Auth", label: "Auth0", patterns: [/^auth0/] },

  // ── Deployment / Infrastructure ──
  { category: "Deployment", label: "Vercel", patterns: [/^@vercel/] },
  { category: "Deployment", label: "Netlify", patterns: [/^@netlify/] },
  { category: "Deployment", label: "Docker", patterns: [/^docker/, /^docker-compose/] },
  { category: "Deployment", label: "AWS", patterns: [/^aws-sdk/, /^boto3?$/] },
  { category: "Deployment", label: "GCP", patterns: [/^@google-cloud/] },
  { category: "Deployment", label: "Azure", patterns: [/^@azure/] },
  { category: "Deployment", label: "Terraform", patterns: [/^terraform/] },
  { category: "Deployment", label: "Gunicorn", patterns: [/^gunicorn$/] },
  { category: "Deployment", label: "Uvicorn", patterns: [/^uvicorn$/] },

  // ── Testing ──
  { category: "Testing", label: "Vitest", patterns: [/^vitest$/] },
  { category: "Testing", label: "Jest", patterns: [/^jest$/] },
  { category: "Testing", label: "Playwright", patterns: [/^@playwright/] },
  { category: "Testing", label: "Cypress", patterns: [/^cypress$/] },
  { category: "Testing", label: "Testing Library", patterns: [/^@testing-library/] },
  { category: "Testing", label: "Pytest", patterns: [/^pytest$/] },
  { category: "Testing", label: "Mocha", patterns: [/^mocha$/] },

  // ── Media / Storage ──
  { category: "Media", label: "Cloudinary", patterns: [/^cloudinary/] },
  { category: "Media", label: "Uploadthing", patterns: [/^uploadthing/] },
  { category: "Media", label: "Sanity", patterns: [/^@sanity/] },
  { category: "Media", label: "Cloudflare R2", patterns: [/^@cloudflare/] },
  { category: "Media", label: "Pillow", patterns: [/^pillow$/] },

  // ── Tooling ──
  { category: "Tooling", label: "ESLint", patterns: [/^eslint$/] },
  { category: "Tooling", label: "Prettier", patterns: [/^prettier$/] },
  { category: "Tooling", label: "Black", patterns: [/^black$/] },
  { category: "Tooling", label: "Ruff", patterns: [/^ruff$/] },
  { category: "Tooling", label: "Mypy", patterns: [/^mypy$/] },
  { category: "Tooling", label: "Turborepo", patterns: [/^turborepo$/] },
  { category: "Tooling", label: "Biome", patterns: [/^@biomejs/] },

  // ── Python Specific ──
  { category: "Python", label: "Celery", patterns: [/^celery$/] },
  { category: "Python", label: "Jinja", patterns: [/^jinja2?$/] },
  { category: "Python", label: "Requests", patterns: [/^requests$/] },
  { category: "Python", label: "httpx", patterns: [/^httpx$/] },
  { category: "Python", label: "Click", patterns: [/^click$/] },
  { category: "Python", label: "Rich", patterns: [/^rich$/] },
  { category: "Python", label: "Typer", patterns: [/^typer$/] },

  // ── Task Queues / Realtime ──
  { category: "Infrastructure", label: "Celery", patterns: [/^celery$/] },
  { category: "Infrastructure", label: "RabbitMQ", patterns: [/^rabbitmq/] },
  { category: "Infrastructure", label: "Kafka", patterns: [/^kafka/] },
  { category: "Infrastructure", label: "Socket.io", patterns: [/^socket\.io$/] },
  { category: "Infrastructure", label: "WebSockets", patterns: [/^websockets$/] },
  { category: "Infrastructure", label: "NGINX", patterns: [/^nginx/] },

  // ── Rust Specific ──
  { category: "Rust", label: "Tokio", patterns: [/^tokio$/] },
  { category: "Rust", label: "Serde", patterns: [/^serde$/] },
  { category: "Rust", label: "Reqwest", patterns: [/^reqwest$/] },
  { category: "Rust", label: "Clap", patterns: [/^clap$/] },
  { category: "Rust", label: "Rusqlite", patterns: [/^rusqlite$/] },
  { category: "Rust", label: "Diesel", patterns: [/^diesel$/] },
  { category: "Rust", label: "SeaORM", patterns: [/^sea-orm$/] },
];

export interface ParsedDep {
  file: string;
  raw: Record<string, string>;
}

export function mapDependencies(parsedDeps: ParsedDep[]): TechStack {
  const stack: TechStack = {};
  const matched = new Set<string>();

  for (const dep of parsedDeps) {
    for (const [pkg] of Object.entries(dep.raw)) {
      for (const mapping of TECH_MAP) {
        if (matched.has(mapping.label)) continue;
        const matches = mapping.patterns.some((p) => p.test(pkg));
        if (matches) {
          if (!stack[mapping.category]) stack[mapping.category] = [];
          stack[mapping.category].push(mapping.label);
          matched.add(mapping.label);
        }
      }
    }
  }

  return stack;
}
