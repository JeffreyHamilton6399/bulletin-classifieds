# Bulletin — local classifieds

A modern, opinionated take on the local classifieds marketplace (think Craigslist, redesigned). Dense, fast, and considered — with a deliberate editorial design system rather than a generic SaaS template.

![Bulletin](public/uploads/seed-synth.png)

## What it is

Bulletin is a regional classifieds platform where users browse and post listings scoped by geographic region — for sale, housing, jobs, services, community, gigs, and discussion.

Create an account for a public profile, or post anonymously — both work.

## Design

- **Type system** — Inter Tight (grotesque) + JetBrains Mono (prices/metadata) + Instrument Serif (display headlines)
- **Palette** — warm paper-cream background, ink-black text, a single oxblood-red accent
- **Texture** — subtle paper grain, hairline dividers, sharp 4px corners
- **Motion** — Framer Motion: staggered reveals, springy hovers, drag-to-swipe gallery, page transitions

## Features

- **Accounts** — sign up with email + password (scrypt-hashed) for a public profile with listings that follow you across devices
- **Anonymous posting** — post with just an email if you prefer; each listing gets a management token
- **Regions** — 8 US cities; listings scoped to your selection
- **Categories & subcategories** — 7 groups with hover-mega-menu navigation
- **Post a listing** — drag-to-reorder image upload (up to 12), price labels (obo/firm/free/trade), 30-day auto-expiry with renew
- **Browse & search** — dense list + custom map view, filters (price, category, keyword, has-image, sort)
- **Listing detail** — swipeable gallery with lightbox, anonymous relay messaging, flag-for-removal
- **Profile pages** — name, bio, avatar, listings grid with renew/remove controls
- **Anti-spam** — community flagging, rate limiting, IP-deduped flags

## Tech stack

- **Framework** — Next.js 16 (App Router) + TypeScript 5
- **Database** — Supabase Postgres (persistent, serverless-friendly)
- **Image storage** — Supabase Storage
- **Auth** — NextAuth.js v4 (Credentials provider, JWT sessions, scrypt hashing)
- **Styling** — Tailwind CSS 4 + shadcn/ui
- **State** — Zustand + TanStack Query
- **Animation** — Framer Motion

## Setup (5 minutes)

### 1. Install dependencies

```bash
bun install
```

### 2. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project (free tier)
2. Wait ~2 min for it to provision
3. Go to **Project Settings → Database** → copy the **Connection string** (URI format)
4. Go to **Project Settings → API** → copy the **Project URL** and **service_role key**
5. Go to **Storage** → create a new **public** bucket named `listings`

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=run: openssl rand -hex 32
NEXTAUTH_URL=http://localhost:3000
```

### 4. Create the database schema + seed sample data

```bash
bun run db:setup
```

This runs `prisma db push` (creates all tables in Postgres) then seeds 8 regions, 7 categories, and ~17 sample listings with images.

### 5. Start the dev server

```bash
bun run dev
```

Open <http://localhost:3000>. Pick a region, then browse or post.

## Deploying to Vercel

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo
3. Add these environment variables in Vercel Project Settings:
   - `DATABASE_URL` — your Supabase Postgres connection string
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key
   - `NEXTAUTH_SECRET` — `openssl rand -hex 32`
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://your-app.vercel.app`)
4. Deploy — the build runs `prisma generate && next build` automatically

**Data persists permanently** across serverless cold starts — accounts, listings, and images all survive.

## Project structure

```
prisma/
  schema.prisma        # Region, Category (tree), Listing, Image, User, Message, Flag
  seed.ts              # sample data
src/
  app/
    api/               # REST routes + NextAuth
    layout.tsx         # fonts + providers + toaster
    page.tsx           # SPA shell with view transitions
    globals.css        # editorial design tokens
  components/
    marketplace/       # Header, CategoryNav, HomeView, BrowseView, MapView,
                       # ListingDetail, ImageGallery, PostListing, ProfileView,
                       # AuthModal, AuthButton, SettingsView, Footer
  lib/
    api.ts             # typed fetch helpers
    auth.ts            # NextAuth config + scrypt hashing
    db.ts              # Prisma client
    supabase-server.ts # Supabase Storage client
    types.ts           # shared types + formatters
  store/
    nav.ts             # Zustand view-router
```

## License

MIT — built as a design study. Sample listing content and images are fictional.
