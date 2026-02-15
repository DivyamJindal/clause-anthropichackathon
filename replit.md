# CLAUSE - AI Legal Platform for India

## Overview

CLAUSE is an AI-powered legal dispute resolution and judicial acceleration platform built for India's justice system. It tells one end-to-end story: a cheque bounce dispute flowing from citizen to courtroom.

1. **CLAUSE Resolve** — For citizens to resolve cheque bounce and other disputes *before* they enter court. Users describe their dispute, and the AI classifies it under Section 138 NI Act, calculates the 30/15/30-day timeline, drafts demand notices, and proposes settlements.

2. **CLAUSE Bench** — An AI law clerk for judges and magistrates. The AI prepares comprehensive briefs with precedent analysis and risk assessments — the judge always decides. Reduces case processing time from 30 minutes to 2 minutes.

The tagline: *"What if every day was a National Lok Adalat?"*

**Narrative Focus**: Ramesh's ₹3 lakh cheque bounces → CLAUSE Resolve walks him through → legal notice → settlement proposed → case enters court → CLAUSE Bench prepares the magistrate's brief → resolved in 2 weeks instead of 18 months.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state (fetch, cache, mutations)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support), custom warm neutral color palette
- **Build Tool**: Vite with HMR support
- **Path Aliases**: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

**Key Pages:**
- `/` — Anthropic-style landing with dark hero section, serif heading "Meet your legal thinking partner", centered input with "Ask CLAUSE" button, category pills, flat stats, and Ramesh's story timeline
- `/resolve` — Claude-style chat interface with sparkle icon, collapsible reasoning display, deadline timeline, legal notice document preview, and escalation to court
- `/bench` — Judge dashboard listing bail applications with clean bordered case list
- `/bench/:id` — Individual case detail with AI-generated bench brief and recommendation card

**Layout**: App uses a collapsible sidebar (`AppSidebar`) with sparkle logo, flat navigation, user profile footer with "Powered by Claude". Main content area scrolls independently.

**Design System (Anthropic-inspired):**
- Light mode: warm cream/beige (40 33% 96%) background, pure white cards, coral primary (15 80% 55%)
- Dark mode: deep olive/forest (75 15% 8%) background, coral primary (15 80% 58%)
- Clean flat surfaces with subtle borders — no glass/blur effects
- Serif headings for hero sections, sans-serif body text
- Sparkle/asterisk logo icon matching Anthropic branding

### Backend
- **Framework**: Express.js on Node.js with TypeScript
- **Runtime**: tsx for development, esbuild for production bundling
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **AI Integration**: Anthropic Claude SDK (claude-sonnet-4-5) for legal analysis
  - Streaming responses for the Resolve chat interface (`/api/resolve/chat`)
  - Structured analysis for Bench briefs (`/api/cases/:id/analyze`)
  - Anthropic client configured via `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` environment variables
- **Replit Integrations**: Built-in chat routes (`server/replit_integrations/chat/`) and batch processing utilities (`server/replit_integrations/batch/`)

**Key API Endpoints (defined in `shared/routes.ts`):**
- `GET/POST /api/disputes` — List/create disputes
- `GET /api/disputes/:id` — Get single dispute
- `POST /api/disputes/:id/analyze` — Trigger AI analysis on a dispute
- `GET/POST /api/cases` — List/create bail cases
- `GET /api/cases/:id` — Get single case
- `POST /api/cases/:id/analyze` — Generate AI bench brief
- `POST /api/resolve/chat` — Streaming chat with Claude's extended thinking (thinking_start/thinking/thinking_end + text events via SSE)
- `POST /api/escalate` — Create a court case from a Resolve chat (Resolve-to-Bench pipeline)
- `/api/conversations/*` — Chat conversation CRUD (Replit integration)

### Shared Code
- `shared/schema.ts` — Drizzle ORM table definitions and Zod validation schemas
- `shared/routes.ts` — API route definitions with type-safe schemas (acts as API contract)
- `shared/models/chat.ts` — Conversation and message table definitions for chat integration

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Session Store**: connect-pg-simple for session persistence
- **Schema Push**: `npm run db:push` (uses drizzle-kit push)
- **Migrations Directory**: `./migrations/`

**Tables:**
- `disputes` — Stores citizen dispute data (description, type, status, AI analysis JSON, generated documents)
- `cases` — Stores bail application data (applicant name, offense type, detention months, AI brief JSON, generated order)
- `conversations` — Chat conversation metadata
- `messages` — Individual chat messages linked to conversations

### Storage Layer
- `server/storage.ts` — `DatabaseStorage` class implementing `IStorage` interface for disputes and cases
- `server/replit_integrations/chat/storage.ts` — Separate storage for chat conversations/messages

### Build & Development
- **Dev**: `npm run dev` — Runs Express + Vite dev server with HMR
- **Build**: `npm run build` — Vite builds client to `dist/public/`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` — Serves static files from `dist/public/` with Express
- **Type Check**: `npm run check`

### Design Decisions
1. **Streaming Chat for Resolve**: The dispute resolution interface uses Server-Sent Events / streaming fetch for real-time AI responses, giving users immediate feedback as the AI "thinks"
2. **Auto-analyze on Case View**: When a judge opens a case detail page, if no brief exists, analysis is automatically triggered — zero-click workflow
3. **Shared Route Definitions**: API contracts defined once in `shared/routes.ts` with Zod schemas, used by both client hooks and server handlers for type safety
4. **JSON columns for AI output**: Analysis results stored as JSONB in PostgreSQL, allowing flexible AI output structures without schema migrations
5. **Extended Thinking**: Claude's extended thinking mode (budget_tokens: 10000) streams separately from text, shown in collapsible "View legal reasoning" sections for full transparency
6. **Resolve-to-Bench Pipeline**: Disputes can escalate to court cases, creating entries in the judge's docket with automatic offense detection from chat context
7. **Anthropic-Inspired Design**: Clean flat surfaces with warm earth tones matching Anthropic's Claude UI — cream/beige light mode, deep olive dark mode, coral accents, serif hero headings, sparkle logo

## External Dependencies

### AI Services
- **Anthropic Claude API** — Primary AI engine for legal analysis, dispute classification, and document generation. Uses streaming for chat interface. Configured via environment variables:
  - `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
  - `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`

### Database
- **PostgreSQL** — Primary data store, required. Connection string via `DATABASE_URL` environment variable.

### Key NPM Packages
- `@anthropic-ai/sdk` — Anthropic Claude client
- `drizzle-orm` / `drizzle-kit` / `drizzle-zod` — ORM, migrations, and schema-to-Zod conversion
- `@tanstack/react-query` — Server state management
- `wouter` — Client-side routing
- `shadcn/ui` ecosystem (Radix UI primitives, class-variance-authority, tailwind-merge, clsx)
- `framer-motion` — Animations (listed in requirements)
- `date-fns` — Date formatting for legal deadlines
- `connect-pg-simple` — PostgreSQL session store
- `p-limit` / `p-retry` — Batch processing utilities for AI calls