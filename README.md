# Bulletin — local classifieds

A modern, opinionated take on the local classifieds marketplace (think Craigslist, redesigned). Dense, fast, and considered — with a deliberate editorial design system rather than a generic SaaS template.

![Bulletin](public/uploads/seed-synth.png)

## What it is

Bulletin is a regional classifieds platform where users browse and post listings scoped by geographic region — for sale, housing, jobs, services, community, gigs, and discussion.

**No account required.** You post with just an email address. Buyers reach sellers through an anonymous email relay. Your email is the key to managing your listings.

## Design

- **Type system** — Inter Tight (grotesque) + JetBrains Mono (prices/metadata) + Instrument Serif (display headlines)
- **Palette** — warm paper-cream background, ink-black text, a single oxblood-red accent. No purple gradients, no templated card grids.
- **Texture** — subtle paper grain, hairline dividers, sharp 4px corners, flat confidence over glossy shadows
- **Motion** — Framer Motion throughout: staggered list reveals, springy hovers, drag-to-swipe image gallery, page transitions (150–300ms with `[0.16, 1, 0.3, 1]` easing)

## Features

- **Regions** — 8 US cities; all listings scoped to your selection, persisted across sessions
- **Categories & subcategories** — 7 groups with ~5 subs each, hover-mega-menu navigation
- **Post a listing** — full form with drag-to-reorder image upload (up to 12), price + labels (obo/firm/free/trade), 30-day auto-expiry, email validation, rate limiting
- **Browse & search** — dense list view with filters (price range, category, keyword, "has image", sort) plus a custom stylized map view (dependency-free, plots listings by lat/lng with hover tooltips)
- **Listing detail** — fluid swipeable image gallery with lightbox, full description, details panel, anonymous relay messaging, flag-for-removal (auto-removes at 5 flags), copy-link
- **Your listings** — enter your email to view, renew, or remove everything you've posted (no password)
- **Anti-spam** — community flagging, per-email rate limiting (5 posts/hr, 3 messages/hr), IP-deduped flags
- **Responsive + dark mode** — mobile-first, sticky footer, full dark theme

## Tech stack

- **Framework** — Next.js 16 (App Router) + TypeScript 5
- **Styling** — Tailwind CSS 4 + shadcn/ui (New York)
- **Database** — Prisma ORM (SQLite)
- **State** — Zustand (client view-router) + TanStack Query (server state)
- **Animation** — Framer Motion
- **Fonts** — Inter Tight, JetBrains Mono, Instrument Serif (Google Fonts)

## Getting started

```bash
# install
bun install

# set up the database (SQLite) + seed sample data
bun run db:push
bun run seed

# start the dev server
bun run dev
```

Open <http://localhost:3000>. Pick a region, then browse or post.

## Project structure

```
prisma/
  schema.prisma        # Region, Category (tree), Listing, Image, User, Message, Flag
  seed.ts              # 8 regions, 7 categories, ~17 sample listings
src/
  app/
    api/               # REST routes: regions, categories, listings, my-listings, stats, upload
    layout.tsx         # fonts + providers + toaster
    page.tsx           # SPA shell with AnimatePresence view transitions
    globals.css        # editorial design tokens (oxblood/ink/paper)
  components/
    marketplace/       # Header, CategoryNav, HomeView, BrowseView, MapView,
                       # ListingDetail, ImageGallery, PostListing, MyListings, Footer
    ui/                # shadcn/ui primitives
    providers.tsx      # ThemeProvider + QueryClient
  lib/
    api.ts             # typed fetch helpers
    db.ts              # Prisma client (Vercel-aware DB path)
    types.ts           # shared serializable types + formatters
    ensure-seeded.ts   # serverless boot: copies seeded DB to /tmp on Vercel
  store/
    nav.ts             # Zustand view-router with region persistence
```

## Deploying to Vercel

This project uses **SQLite** (per its constraints), which is read-only on Vercel's serverless filesystem. To make the demo work in production, the app ships a pre-seeded `db/custom.db` that gets copied to `/tmp` on the first cold start of each serverless instance (`src/lib/ensure-seeded.ts`). Data persists for the life of a warm instance.

**For true production persistence** (listings that survive indefinitely, writes that stick), swap the Prisma datasource to a hosted database — Vercel Postgres, Neon, or Supabase. It's a one-line change in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")  // set DATABASE_URL in Vercel project settings
}
```

Then run `prisma db push` against your new database and re-seed.

### Build setup

- `postinstall` runs `prisma generate` automatically
- The default Vercel build (`next build`) works out of the box
- No environment variables required for the SQLite demo; set `DATABASE_URL` only if you switch to Postgres

## License

MIT — built as a design study. Sample listing content and images are fictional.
