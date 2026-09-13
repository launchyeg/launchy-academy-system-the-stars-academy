# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

The Stars Academy — a React admin dashboard (Arabic, RTL) for managing an academy's groups and students: enrollment, monthly subscriptions/payments, attendance, grades, and sending payment receipts/monthly reports to a parent's WhatsApp via `wa.me` links. No backend server of its own — Supabase (Postgres + Auth) is the entire backend, called directly from the client.

## Commands

```bash
npm run dev       # Vite dev server
npm run build      # Production build into dist/
npm run preview    # Preview the production build locally
npm run lint        # ESLint over the whole project
```

No test suite exists in this repo. `.env` must define `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see README §2) or the app cannot reach Supabase.

## Architecture

**Data flow is centralized in two contexts, both wired at the root in `src/App.jsx`:**

- `src/context/AcademyContext.jsx` is the *only* place that queries the `groups`/`students`/`subscriptions` tables. It fetches the entire group → students → subscriptions tree in one nested `select` on load, maps Supabase's snake_case columns to the camelCase shape the UI uses (`mapGroup`/`mapStudent`/`mapSubscription`), and exposes CRUD actions (`addGroup`, `updateGroup`, `deleteGroup`, `updateStudent`, `addSubscription`, `updateSubscriptionRecords`, etc.). Every mutation calls `refresh()` afterward instead of doing optimistic local updates — components never talk to Supabase directly, they call context actions and read the re-synced `groups` array. When adding any new data operation, extend this context rather than querying Supabase from a component.
- `src/context/AuthContext.jsx` wraps Supabase Auth (`signInWithPassword`/`onAuthStateChange`/`signOut`). There is no public sign-up; the single admin account is created manually in the Supabase dashboard.
- `src/lib/supabaseClient.js` creates the one shared Supabase client from the env vars.

**Data model:** one subscription = one calendar month's record set for a student. `attendance` and `quizzes` are fixed-length arrays (length = `RECORD_SLOTS` in `src/constants.js`, currently 8) representing that month's per-session attendance/grades; `createEmptyMonthRecords()` builds the empty shape used when starting a new subscription. Attendance/grade edits in `AttendanceModal.jsx` are held as a local draft and committed together via `updateSubscriptionRecords`, not saved per-keystroke.

**Routing** (`src/App.jsx`): `/` and `/login` are public; everything under `/dashboard` is wrapped in `ProtectedRoute` (redirects to `/login` if unauthenticated) and rendered inside `DashboardLayout` (sidebar + header shell). Route → page mapping is in README §6.

**Data Center** (`src/pages/DataCenter.jsx`, route `/dashboard/data-center`): a read-only table flattening every student across all groups (via `groups.flatMap`), with a button that exports name/phone/parent-phone to an `.xlsx` file using the `xlsx` package — built for feeding parent/student phone numbers into ad platforms (e.g. Meta Ads custom audiences). It reads from `AcademyContext` only; it has no edit/delete actions and adds no new data operations.

**WhatsApp integration** (`src/utils/whatsapp.js`): builds `wa.me` links with pre-filled text for two message types — a payment receipt and a monthly report (subscription history, attendance summary, grades, notes) — sent to `student.parentPhone`. This is the delivery mechanism for both receipts and reports; there's no separate messaging backend.

**Site identity** (`src/siteConfig.js`): site name, social links, developer credit. Referenced by the tab title (set via `document.title` in `App.jsx`'s effect, since `index.html`'s `<title>` is static), login page, sidebar, footer, and WhatsApp message signatures. Edit this one file rather than hardcoding the name/links elsewhere.

**Styling/RTL:** Tailwind CSS, `dir="rtl"` throughout, side nav fixed to the right. Font is Tajawal (Google Fonts) for Arabic. All in-app UI text is Arabic. Brand `primary` color ramp lives in `tailwind.config.js` (`primary-600 = #FFA617`, `primary-700 = #fd9a00`).

## Notes for changes

- Deleting a group does not cascade to its students/subscriptions — the FK is `ON DELETE SET NULL`, so students are ungrouped, not deleted (see `deleteGroup` in `AcademyContext.jsx`).
- New subscription IDs are generated client-side with `crypto.randomUUID()` rather than left to the DB default, so the ID is available immediately after insert without a second round trip.
- All Supabase tables have Row Level Security enabled — only authenticated requests can read/write; there is no anonymous access path to guard against separately in the UI.
- The database schema is tracked in `supabase/schema.sql` (canonical, run-from-scratch definition of every table/FK/RLS policy) plus `supabase/migrations/` (one dated file per incremental change since). Any schema change must be added to `migrations/` *and* folded into `schema.sql` — see `supabase/README.md`. This is what lets the project be redeployed against a brand new Supabase project by running one file.
