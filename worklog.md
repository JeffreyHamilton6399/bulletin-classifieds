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

---
Task ID: 4
Agent: main (orchestrator)
Task: Fix region selector bug + secure listing management (no-password security)

Work Log:
- Bug: region selector name used `hidden xs:inline` but `xs` is not a default Tailwind breakpoint → region name was ALWAYS invisible, so users couldn't see/change their region. Fixed to always-visible with mobile truncation.
- Security gap closed: replaced email-based listing access with per-listing edit tokens.
  - Added `editToken String @unique` to Listing schema (crypto.randomBytes(18) base64url)
  - Create route generates + returns the token; re-seeded all 17 listings with tokens
  - PATCH (renew/delete) now authorizes by token, not email → 401 missing / 403 invalid
  - /api/my-listings is now POST {tokens:[]} — no email enumeration possible
  - New lib/tokens.ts: localStorage token manager (store on post, add-by-link, forget-on-device, parse manage URLs)
  - PostListing saves token to browser after publishing; toast confirms "saved to Your listings on this device"
  - Rebuilt MyListings view: reads stored tokens, renew/remove/copy-link/forget buttons, "Why no password?" security note, add-by-link input for cross-device access
  - "How it works" card updated: "Token-protected" replaces "Manage anytime"
- Verified end-to-end in browser: region now visible, post → token saved → Your listings shows it → renew works (toast) → wrong token returns 403, missing token returns 401
- Lint clean; committed (5e69c12) and pushed to GitHub

Stage Summary:
- Region selector is now visible and usable on all screen sizes
- Listings are secure WITHOUT passwords: each gets a secret management token saved to the poster's browser. Only the device that posted (or anyone given the management link) can renew/remove. Knowing the poster's email grants nothing.
- This is the Craigslist-style "manage link" model — no account, no password, no email infrastructure, yet secure.
- Pushed to github.com/JeffreyHamilton6399/bulletin-classifieds (commit 5e69c12)

---
Task ID: 5
Agent: main (orchestrator)
Task: Add optional accounts with profiles (NextAuth + scrypt)

Work Log:
- Added User fields: passwordHash, bio, avatarColor (random from 6-color palette)
- Built NextAuth v4 Credentials provider with JWT sessions (serverless-friendly):
  - src/lib/auth.ts: scrypt password hashing (Node crypto, no deps), authorize callback, jwt/session callbacks exposing user.id
  - src/app/api/auth/[...nextauth]/route.ts: route handler
  - src/app/api/auth/signup/route.ts: signup with validation + rate limit + auto-login
- API: /api/me (GET own profile+listings, PATCH bio/name), /api/profile/[id] (public profile + active listings)
- Listings posted while signed in now link to userId
- Worked around a Turbopack/NextAuth v4 interop bug where SessionProvider resolved to undefined — created src/lib/next-auth-client.ts thin wrapper using default import. All client auth imports go through it.
- UI:
  - AuthModal: login/signup tabs, validation, toasts, auto-login after signup
  - AuthButton: "Sign in" when logged out → colored letter avatar + dropdown (Your profile / Your listings / Sign out) when logged in
  - ProfileView: public profile (avatar, name, bio, member-since, listings grid); own profile has Edit (name + bio, 500-char limit)
  - SessionProvider added to Providers tree
- Security: .env was tracked and leaked NEXTAUTH_SECRET → untracked it, added .env.example. README documents required Vercel env vars (NEXTAUTH_SECRET, NEXTAUTH_URL).
- Browser-verified full flow: signup (Jamie Test) → auto-login → post listing while signed in → profile shows it → edit bio → "Profile updated" toast
- Lint clean; committed (a81439b) and pushed to GitHub

Stage Summary:
- Hybrid model now live: accounts (profiles + cross-device) OR anonymous (per-listing tokens). Both coexist.
- Accounts use scrypt hashing, JWT sessions, no external email service needed.
- Known limitation (documented in README): SQLite resets on Vercel cold-start, so accounts/lists don't persist in production without switching to Postgres (one-line schema change + DATABASE_URL env var).
- Pushed to github.com/JeffreyHamilton6399/bulletin-classifieds (commit a81439b)

---
Task ID: 6
Agent: main (orchestrator)
Task: Fix Vercel build blocker + mobile UI bugs + add app icon

Work Log:
- CRITICAL Vercel build fix: 'Environment variable not found: DATABASE_URL'.
  Root cause: .env was untracked (contained NEXTAUTH_SECRET) so Vercel had no
  DATABASE_URL at build time. prisma db push / generate both fail without it.
  Fix: scripts/ensure-env.js writes a fallback DATABASE_URL=file:/tmp/bulletin-build.db
  to .env if missing. Wired into postinstall + vercel-build. vercel-build now
  only runs 'prisma generate && next build' (no db push/seed — runtime ensureBooted
  copies the shipped DB to /tmp).
- Mobile signup bug: Name field rendered off-screen (y: -54) because the modal
  was taller than the viewport and centered with place-items-center, pushing
  the top above the visible area. Fixed: place-items-start on mobile +
  overflow-y-auto so the modal scrolls. Verified Name field now at y:174.
- File upload mobile bug: input used className='hidden' (display:none) which
  fails to open the file picker on iOS Safari when .click() is called.
  Changed to 'sr-only' (visible but clipped) — mobile-safe.
- App icon: created favicon.svg (italic serif 'B' on oxblood) + generated
  apple-icon.png (1024px) via image-gen. Updated layout metadata icons config.
- QA: verified home, signup, post form all render correctly on 390px mobile.
  All fields (Title, Category, Price, Description, Location, Upload, Email,
  Name, Phone) visible and usable.
- Lint clean; committed (5a4fe40) and pushed to GitHub.

Stage Summary:
- Vercel build should now succeed without any env vars configured (fallback
  DATABASE_URL is auto-created). For accounts to work in production, user
  still needs to set NEXTAUTH_SECRET + NEXTAUTH_URL in Vercel.
- All reported mobile UI bugs fixed.
- Custom icon shipped.
- Pushed to github.com/JeffreyHamilton6399/bulletin-classifieds (commit 5a4fe40)
