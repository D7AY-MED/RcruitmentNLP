# xQuesty — Stitch Redesign Briefs (Source of Truth)

> Status: **prep phase** — written before generating, per the approved workflow.
> Stitch MCP is configured but its tools load only after a Claude Code **restart**.
> Once restarted, each "PROMPT" block below is fed to Stitch `create_project` / design tools,
> Light + Dark, then reviewed → refined → explained → and only then implemented in React/Tailwind
> on the **existing** architecture (no backend / API / route / auth / DB / MVC changes).

---

## 0. GLOBAL DESIGN LANGUAGE  (prepend to every page prompt)

**Product:** xQuesty — an AI-powered recruitment platform. Enterprise, AI-native, trustworthy, premium.
**Aesthetic:** the intersection of Linear, Stripe, Vercel, OpenAI, Apple, Framer, Notion, Figma.
Avoid generic templates, Material defaults, Bootstrap layouts.

**Brand colors**
- Primary — Deep Indigo `#4F46E5` (scale 50 `#EEF2FF` … 700 `#4338CA`)
- Secondary — Electric Blue `#2563EB` (flat accents, links)
- Accent — Cyan `#06B6D4` / `#22D3EE`
- **Signature gradient** — Indigo → Cyan `linear-gradient(135deg,#4F46E5,#06B6D4)` used for hero, primary CTAs, the logo mark, key data highlights. Every gradient surface MUST sit on a solid color base (never gradient-only).
- Neutrals — Slate (`#0F172A` ink … `#64748B` muted … `#E2E8F0` border … `#F8FAFC` surface)
- Status — Success emerald `#059669`, Warning amber `#F59E0B`, Danger red `#DC2626`, Info blue `#2563EB`

**Typography**
- Display/headings — **Space Grotesk** (tight tracking, -0.02em on large)
- UI/body — **Inter**
- Numbers / metrics / code / mono labels — **JetBrains Mono**

**System**
- 8px spacing grid; generous whitespace.
- Radius: inputs/buttons 12px, cards 16px, hero/feature cards 24px.
- Elevation: soft, layered shadows (never harsh); subtle glassmorphism on sticky headers/overlays only.
- Motion: subtle, Linear/Stripe-style — fade-up on scroll, spring on hover/press, animated counters, smooth drawer/modal transitions. Respect `prefers-reduced-motion`.

**Themes — both equally polished**
- LIGHT: white/`#F8FAFC` canvas, white cards, slate text, soft shadows, indigo/cyan accents. Clean, bright, premium.
- DARK: deep charcoal canvas `#0A0B12` (NOT pure black), layered surfaces `#14161F` / `#1A1B23`, hairline borders `rgba(255,255,255,.08)`, brighter indigo/cyan accents, excellent contrast, luxury feel.

**Responsive:** desktop, laptop, tablet, mobile. **A11y:** WCAG AA contrast, visible focus rings, keyboard-navigable, readable type.

**Hard rule:** these are *xQuesty's real screens* — use the exact content/sections specified per page. Do not invent unrelated features.

---

## 1. LANDING PAGE  (existing route `/`)

Sections (in order): sticky glass header (logo + nav: Recruteurs/Candidats/Fonctionnalités/Tarifs/FAQ + theme toggle + "Démarrer" CTA) → hero (Indigo→Cyan gradient mesh, animated AI illustration, headline "Trouvez le bon candidat au bon poste", dual CTA, trust line, floating **AI Match Score** card showing ranked candidates with % scores) → trusted-companies logo row → animated statistics (2 000+ candidats, 95% satisfaction, 3× plus rapide, zéro biais) → "Comment ça marche" 3 steps → features (recherche sémantique, entretiens IA, gestion d'offres, évaluation équitable) → product/dashboard preview (browser-chrome mock with KPIs, chart, top matches) → testimonials → pricing (Découverte/Pro/Entreprise, Pro featured) → FAQ accordion → final gradient CTA → rich footer. French copy.

**PROMPT (Stitch):** "Design a premium enterprise SaaS landing page for **xQuesty**, an AI recruitment platform. [GLOBAL]. Hero with an Indigo→Cyan gradient mesh background, an animated abstract AI/neural illustration, a bold Space Grotesk headline, dual CTAs, and a floating glass 'AI Match Score' card listing 3 candidates with mono % scores and progress bars. Then: trusted-company logo strip, a 4-stat counter band, a 3-step 'how it works', a 2×2 feature grid with iconography, a browser-framed product dashboard preview, a 3-card testimonial row, a 3-tier pricing table (middle tier highlighted with the gradient), an FAQ accordion, a gradient call-to-action band, and a multi-column footer. Deliver Light and Dark, desktop + mobile."

---

## 2. RECRUITER

> Existing routes: `/recruiter/login`, `/recruiter/register`, `/dashboard` (AI talent matcher + search history), `/job-pools`, `/job-pools/:id` (pool detail + applicants table + candidate drawer). "AI Ranking", "Reports", "Settings" for recruiter are partly via the profile modal / not all routed yet — flagged as new screens.

**2.1 Login** — centered premium auth card on a soft Indigo→Cyan aura background; xQuesty logo, email/password with floating labels + focus glow, gradient primary button, "create account" link, inline error state. Light+Dark.

**2.2 Register** — same shell; fields full name, email, company, phone (optional), password; subtle multi-field layout, trust microcopy. Light+Dark.

**2.3 Dashboard (Talent Matcher)** — app shell (collapsible sidebar: Talent Matcher, Job Pools; sticky header with profile dropdown + theme toggle). Main: a prompt-style "describe the role" search panel (pool selector + natural-language textarea + gradient Search), and an AI results list of ranked candidate cards (rank badge, name, semantic match explanation in a tinted panel, contact, CV). Right rail: search history timeline. Empty + loading skeletons. Light+Dark.

**2.4 Job Pools** — header + "Create pool" gradient button; responsive grid of premium pool cards (title, company, status badge, created date, applicant count, public-link copy, actions menu). Empty/loading/error states; load-more. Light+Dark.

**2.5 Candidate Details (pool detail + drawer)** — pool info card (status, public link, status actions) + details grid + applicants data table (avatar, name, phone, **AI score** with progress, status, updated). Right slide-over drawer: candidate header, progress, **AI summary** card, Q&A transcript viewer. Light+Dark.

**2.6 AI Ranking** *(new screen)* — a focused ranking board: candidates sorted by semantic match, score distribution chart, filters, side-by-side skill match breakdown, "why ranked" explainability panel. Light+Dark.

**2.7 Reports** *(new for recruiter)* — KPI cards, hiring funnel chart, time-to-screen, pool performance, export buttons. Light+Dark.

**2.8 Settings** — tabbed (Profile, Company, Notifications, Theme, Danger Zone); premium forms, avatar upload, segmented controls. Light+Dark.

**PROMPT pattern:** "[GLOBAL]. Design the xQuesty **recruiter <screen>**: <sections above>. Use the app shell (collapsible left sidebar, sticky glass header with profile menu + theme toggle). Premium data tables with sticky headers and row hover, tinted AI-explanation panels, mono numeric scores, soft cards. Light and Dark, desktop + mobile."

---

## 3. CANDIDATE

> Existing: public offers list (`/offers`), apply pages (`/apply/:token`), AI interview (`/apply/interview/:token`), profile (`/candidate/profile`). Candidates currently auth via a modal, not dedicated pages. "Dashboard", "Applications", "Resume", "Career Insights", dedicated "Login/Register" are flagged **new screens** (would need new routes — see caveat at end).

**3.1 Login / 3.2 Register** *(new)* — friendly, bright auth cards (candidate tone warmer than recruiter), social-proof microcopy, gradient CTA. Light+Dark.

**3.3 Dashboard** *(new)* — welcome header, application progress tracker, recommended offers, interview invitations, profile-completion meter. Light+Dark.

**3.4 Applications** *(new)* — timeline/list of applications with stage tracker (Applied → Interview → Review → Decision), AI interview status, per-application score. Light+Dark.

**3.5 Resume** *(new)* — résumé/CV manager: upload dropzone, parsed-profile preview, edit sections, completeness score. Light+Dark.

**3.6 Interview (existing)** — premium conversational AI interview: setup (CV dropzone + phone), then a calm chat-style Q&A with an "Assessment Phase" progress bar, AI question card with subtle pulse, large autosaving answer textarea, word count, and a celebratory completion screen. Light+Dark.

**3.7 Profile (existing)** — avatar + identity header with "Open to work" badge, view/edit modes, sectioned cards (Personal, Professional, Education, Links & Salary), toast feedback. Light+Dark.

**3.8 Career Insights** *(new)* — analytics for the candidate: match trends, skill gaps vs market, suggested roles, salary benchmarking, charts. Light+Dark.

**PROMPT pattern:** "[GLOBAL]. Design the xQuesty **candidate <screen>**: <sections>. Warm but premium; bright in light mode, luxurious charcoal in dark. Progress trackers, soft cards, clear CTAs. Light and Dark, desktop + mobile."

---

## 4. ADMIN  (existing self-contained module under `/admin/*`)

> Existing routes: login, dashboard, users, companies, jobs, applications, reports, settings. Has its own UI kit.

**4.1 Login** — admin auth card (slightly more "console" feel), shield/logo, gradient button. Light+Dark.
**4.2 Dashboard** — 8 KPI cards (candidates, recruiters, pools, applications, companies, active pools, completed, AI summaries), growth area chart, status donut, recent-activity feed with live badge, quick actions, job-pools bar chart. Light+Dark.
**4.3 Users** — searchable, filterable data table (avatar+name+email, type, company, status, joined, row actions), pagination, create-user modal, detail drawer (view/edit). Light+Dark.
**4.4 Companies** — responsive company cards (logo chip, name, industry, recruiter/job counts, website), search, detail drawer. Light+Dark.
**4.5 Jobs** — jobs table (title/location, company, contract, status incl. archived, created, actions), filters, detail drawer with skill badge groups. Light+Dark.
**4.6 Applications** — read-only interview sessions table (candidate, pool, progress bar, status, updated), transcript drawer with AI summary + Q&A. Light+Dark.
**4.7 Reports** — KPI cards, interview-completion gauge, top-companies bar chart, CSV/XLSX export panel. Light+Dark.
**4.8 Settings** — tabs (My Profile, Admin Users, Security, API Keys); admin table, password form, API-keys empty state. Light+Dark.

**PROMPT pattern:** "[GLOBAL]. Design the xQuesty **admin <screen>** as a premium analytics console: fixed collapsible sidebar, sticky glass topbar with profile menu + theme toggle, KPI cards with mono figures, refined charts (area/donut/bar) in indigo/blue/cyan, dense-but-airy data tables with sticky headers, slide-over detail drawers. Light and Dark, desktop + mobile."

---

## 5. SHARED COMPONENT LIBRARY  (design as a kit page, both themes)

Buttons (primary gradient/secondary/outline/ghost/danger, 4 sizes, loading) · Cards (base/feature/stat/pricing) · Tables (sticky header, hover, zebra-free, skeleton) · Charts (area/donut/bar tooltips) · Inputs (text/textarea/select, floating labels, focus glow, error/success) · Search · Filters (pills/segmented) · Navigation + Sidebar (expanded/collapsed) · Header (glass, scrolled) · Footer · Drawers · Modals · Badges (status/AI score) · Avatars (single + group) · Toasts (success/error/info) · Empty states · Loading skeletons · Error states.

**PROMPT:** "[GLOBAL]. Design a cohesive xQuesty **component library** sheet showing every component above with its variants and states, in Light and Dark side by side. Mono numerics, gradient primary actions on solid bases, soft elevation, 12–16px radii."

---

## CAVEAT — new screens vs. existing routes

Several requested screens don't exist as routes today (recruiter AI Ranking/Reports/Settings pages; candidate Login/Register/Dashboard/Applications/Resume/Career Insights). I will **design** all of them in Stitch. **Implementing** the net-new ones requires adding routes in `src/App.tsx` — which touches routing. Per your "do not change routes" rule, I'll get explicit sign-off before adding any route; existing pages are redesigned in place with zero routing changes.

## Generation batches (after restart)
1. Landing (L+D) → review/refine/approve
2. Shared component kit (L+D) → establishes tokens for everything
3. Admin set (8) → 4. Recruiter set → 5. Candidate set
Each batch: generate → review → refine → explain why better → implement after approval.
