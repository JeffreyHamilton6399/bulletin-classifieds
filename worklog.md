# Bulletin — Classifieds Marketplace Worklog

---
Task ID: 1
Agent: main (orchestrator)
Task: Foundation — design system, Prisma schema, seed data, API routes

Work Log:
- Explored existing Next.js 16 project (shadcn/ui, Tailwind 4, Prisma/SQLite, Framer Motion, Zustand, TanStack Query all available)
- Designed editorial/newspaper aesthetic: warm paper-cream background, ink text, oxblood accent; 3-font system (Inter Tight + JetBrains Mono + Instrument Serif); sharp 4px radius; subtle paper grain texture
- Rewrote `src/app/globals.css` with the new palette + texture utilities
- Rewrote `src/app/layout.tsx` with the three Google fonts + Providers wrapper
- Created `src/components/providers.tsx` (ThemeProvider + QueryClient)
- Authored Prisma schema: Region, Category (self-referencing tree), Listing, Image, User, Message, Flag + Status/FlagReason enums; ran `db:push`
- Generated 10 seed images via z-ai CLI into `public/uploads/`
- Wrote `prisma/seed.ts`: 8 regions, 7 categories with ~5 subs each, 17 realistic listings; ran successfully
- Built API routes: `/api/regions`, `/api/categories`, `/api/listings` (GET with filters + sort), `/api/listings/create` (POST with validation + rate limit), `/api/listings/[id]` (GET + PATCH renew/delete), `/api/listings/[id]/flag`, `/api/listings/[id]/message`, `/api/upload`
- Created `src/lib/types.ts` (shared serializable types + price/time formatters), `src/store/nav.ts` (Zustand SPA view router with region persistence)

Stage Summary:
- Design system committed: oxblood/ink/paper, sharp corners, mono metadata, serif display accents
- DB seeded and all API endpoints verified via curl (regions, categories, listings all return data)
- Listing shape includes `_thumb`, `_imageCount`, `_categoryName/Slug`, `_regionName` for efficient list rendering
- Ready to build the frontend SPA views on the single `/` route

---
Task ID: 2
Agent: main (orchestrator)
Task: Frontend SPA — all views, wiring, and end-to-end verification

Work Log:
- Built data layer: `src/lib/api.ts` (typed fetch helpers), `src/lib/icons.ts` (lucide category icon map), `src/store/nav.ts` (Zustand view router with region persistence to localStorage)
- Built `Header` (wordmark, region dropdown, search, theme toggle, post button), `CategoryNav` (7 groups with hover subcategory menus), `Footer` (sticky via mt-auto)
- Built `HomeView`: no-region state shows editorial region picker ("Where are you looking?"); with region shows masthead (date + region), newspaper-column category directory, and staggered "Recently posted" list
- Built `BrowseView`: dense list with filter bar (category/price/has-image/sort), list↔map toggle, mobile-collapsible filters, AnimatePresence list transitions
- Built `MapView`: dependency-free stylized geographic scatter — plots listings by lat/lng over a grid with crosshair + hover tooltips
- Built `ListingRow` (dense thumb/title/meta/price rows), `ImageGallery` (drag-swipe + thumbnails + lightbox), `ListingDetail` (gallery + price + details + reply form + flag panel + copy link), `PostListing` (full form with drag-reorder image upload via /api/upload)
- Wired `page.tsx` as SPA shell with AnimatePresence page transitions; sticky footer via min-h-screen flex flex-col
- Fixed: missing `regionId` in create payload (400 → 201); expiry label using future-aware formatter; removed unnecessary effect (lint); added no-scrollbar utility

Verification (Agent Browser + VLM):
- Region select → home dashboard → browse (filters + map) → listing detail → post → reply: ALL flows pass end-to-end
- Post listing creates record and navigates to detail (verified 201 + DB insert)
- Reply message sends successfully (201 + Message INSERT)
- VLM confirms design "avoids typical AI/SaaS tropes", "unique vibe", "intentional"; mobile (390px) responsive with footer sticking correctly; dark mode renders with good contrast
- Lint clean; no runtime errors in dev.log

Stage Summary:
- Complete classifieds marketplace delivered on single `/` route as an SPA
- Design: oxblood/ink/paper palette, Inter Tight + JetBrains Mono + Instrument Serif, sharp 4px radius, paper grain, hairline dividers — distinctly editorial, not templated
- 17 seeded listings across 8 regions / 7 categories with 12 AI-generated item photos
- All required features working: regions, categories+subs, post (up to 12 images, 30-day expiry), browse/search with price/keyword/has-image filters, map view, fluid image gallery, anonymous relay messaging, flag-for-removal, rate limiting, email validation, responsive + dark mode

---
Task ID: 3
Agent: main (orchestrator)
Task: Production polish + GitHub/Vercel deployment

Work Log:
- Added Sonner toasts across all actions (post, message, flag, renew, copy-link, upload) with editorial-styled toaster
- Built "My Listings" management view + /api/my-listings: enter your email → see all your posts with renew/remove buttons. This is the no-account answer: your email IS the key, no password needed.
- Added "How it works" 3-card info panel on the post form: No account / Anonymous relay / Manage anytime — makes the anonymous posting model obvious
- Added /api/stats + home stats strip (active / posted today / categories / with photos) with tabular-nums
- Added "Your listings" (UserRound icon) link in header + footer
- Production/Vercel prep:
  - postinstall: prisma generate (auto-runs on Vercel install)
  - src/lib/ensure-seeded.ts: copies shipped db/custom.db → /tmp on serverless cold start (Vercel filesystem is read-only except /tmp)
  - src/lib/db.ts: Vercel-aware DATABASE_URL resolution (file:/tmp/bulletin.db on Vercel)
  - Refactored seed.ts to export reusable runSeed()
  - README with full deploy instructions + Postgres swap guidance for true persistence
  - Richer OpenGraph metadata + metadataBase
- Browser-verified: My Listings flow (email → listings → renew toast), home stats render, post form info cards render, all prior flows intact
- Lint clean, no runtime errors
- Git: created GitHub repo via API, pushed all commits (3 total). Repo: github.com/JeffreyHamilton6399/bulletin-classifieds
- Cleaned PAT from remote URL (replaced with plain HTTPS URL)

Stage Summary:
- App is production-polished: toasts everywhere, clear no-account UX, listing management, stats
- Shipped to GitHub, ready for Vercel import (no env vars needed for SQLite demo; set DATABASE_URL only if switching to Postgres)
- Known limitation documented: SQLite data resets per serverless cold-start; README explains the one-line Postgres swap for permanent persistence
