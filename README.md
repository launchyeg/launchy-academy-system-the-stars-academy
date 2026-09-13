# The Stars Academy

An admin dashboard for managing an academy's groups and students: create groups, enroll students, track monthly subscriptions/payments, record attendance and grades, and send payment receipts and monthly reports straight to a parent's WhatsApp. The backend is [Supabase](https://supabase.com) (hosted Postgres) — all groups/students/subscriptions data is persisted there, and admin login is real Supabase Auth rather than a client-side check.

## 1. Installation

```bash
npm install
```

## 2. Configuration

The app needs a Supabase project (tables + Auth). Create a `.env` file with:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

Both values come from your Supabase project's **Settings → API** page. The publishable/anon key is safe to expose client-side — access is actually controlled by the Row Level Security policies on each table (see [Backend](#4-backend--database) below), not by keeping this key secret.

There is no public sign-up — the admin account is created directly in the Supabase dashboard under **Authentication → Users**, with **Allow new users to sign up** turned off. The login form authenticates against that account's email/password, and the session is managed by `supabase-js` and persists across page refreshes until logout.

## 3. Run project

```bash
npm run dev
```

```bash
npm run build      # Build the production copy inside the dist folder
npm run preview    # Preview the production version locally
npm run lint        # Run ESLint
```

## 4. Backend / Database

Three tables in Postgres, all with Row Level Security enabled (only authenticated requests may read/write; anonymous requests are blocked entirely):

```
groups (id, name)
  └─ students (id, group_id, name, phone, parent_phone, price)
       └─ subscriptions (id, student_id, start_date, end_date, payment_method, paid,
                          attendance[], quizzes[], final_exam, note)
```

- One subscription = one month's record set — `attendance`/`quizzes` are fixed-length array columns (see `RECORD_SLOTS` in `src/constants.js`) holding that month's per-session attendance and quiz grades.
- `paid` is a boolean, defaulting to `true` the moment a subscription is created; the admin can flip it off from the paid toggle in the subscriptions log if the payment doesn't actually go through, which surfaces a "لم يتم الدفع بعد" (no payment yet) warning under that subscription.
- `src/lib/supabaseClient.js` creates the shared Supabase client from the env vars above.
- `src/context/AcademyContext.jsx` is the only place that talks to the `groups`/`students`/`subscriptions` tables — it fetches the full group/student/subscription tree on load, maps the DB's snake_case columns to the camelCase shape the UI expects, and re-syncs after every mutation. No other component queries Supabase directly.
- `src/context/AuthContext.jsx` wraps Supabase Auth (`signInWithPassword` / `onAuthStateChange` / `signOut`) for the admin session.

## 5. Folder Structure

```
src/
  components/
    icons/
      WhatsAppIcon.jsx       # Shared WhatsApp glyph (not in lucide-react's icon set)
      TikTokIcon.jsx         # Shared TikTok glyph (not in lucide-react's icon set)
    AddStudentModal.jsx     # Add-student form (name, phone, parent phone, price, payment method)
    AttendanceModal.jsx     # Per-student subscriptions: attendance, quiz grades, final exam grade, notes
    ConfirmDialog.jsx       # Generic confirm-before-delete dialog
    EditGroupModal.jsx      # Rename-group form (used from the Groups page)
    GroupCard.jsx           # Group summary card (used in the Groups list)
    Header.jsx              # Top bar (admin email, logout)
    Modal.jsx               # Base modal shell
    ProtectedRoute.jsx      # Redirects to /login when not authenticated
    Sidebar.jsx             # Dashboard side navigation
    StatCard.jsx            # Overview stat tile
    StudentTable.jsx        # Students table inside a group's page

  context/
    AuthContext.jsx         # Supabase Auth session (see Configuration above)
    AcademyContext.jsx      # All academy data + actions, backed by Supabase (see Backend above)

  lib/
    supabaseClient.js        # Shared Supabase client instance

  layouts/
    DashboardLayout.jsx      # Sidebar + header shell wrapping every /dashboard/* page

  pages/
    Home.jsx
    Login.jsx
    DashboardOverview.jsx
    CreateGroup.jsx
    Groups.jsx
    GroupDetails.jsx
    DataCenter.jsx            # Read-only, all-students table + one-click Excel export

  utils/
    whatsapp.js               # Builds wa.me links for payment receipts and monthly reports

  siteConfig.js                # Site name, social links, developer credit — edit here to update them everywhere
  constants.js                 # Shared constants (attendance slot count, empty month-record shape)
  App.jsx
  main.jsx
  index.css
```

## 6. Routes

| The path                  | Page                      |
| ------------------------- | ------------------------- |
| `/`                       | Home                      |
| `/login`                  | Login                     |
| `/dashboard`              | Overview (requires login) |
| `/dashboard/create-group` | Create Group              |
| `/dashboard/groups`       | All Groups                |
| `/dashboard/groups/:id`   | Group Details             |
| `/dashboard/data-center`  | Data Center (export)      |

## 7. Core Features

- **Groups & students** — create groups (and rename/delete them), add/edit/delete students (name, phone, parent phone, monthly price).
- **Monthly subscriptions** — add a subscription with a start date (end date auto-computed 30 days later) and a payment method (Cash / InstaPay / Vodafone Cash).
- **Attendance & grades per subscription** — each subscription (one month) carries its own record set: attendance toggles, quiz grades, a final exam grade, and a free-text note. Records are edited as a draft and committed together via an explicit "Save" action.
- **WhatsApp integration** (`src/utils/whatsapp.js`) — one click opens a pre-filled WhatsApp message to the student's parent for:
  - a **payment receipt** (subscription price, period, payment method), and
  - a **monthly report** (subscription/payment history, attendance summary, quiz grades, final exam grade, and notes).
- **Dashboard overview** — total groups, total students, total monthly revenue, and a "most populated groups" breakdown.
- **Data Center** (`/dashboard/data-center`) — a read-only table of every student across every group (name, phone, parent phone) with a one-click export to an `.xlsx` file (via the `xlsx` package), meant for feeding student/parent phone numbers into ad platforms like Meta Ads.

## 8. Site Configuration

`src/siteConfig.js` centralizes site-wide identity: the site name (shown in the browser tab, login page, sidebar, footer, and WhatsApp message signatures), social links (rendered as icons in the Home page footer — only entries with a non-empty URL are shown), and the developer credit. Edit that one file to update these across the whole site.

## 9. Technical Notes

- The application's general orientation is RTL (`dir="rtl"`), and the side menu is always on the right side of the screen. The font used is **Tajawal** (loaded from Google Fonts) to best support the appearance of Arabic text. All in-app UI text is in Arabic; this README is in English.
- Icons: `lucide-react`; animations and transitions: `framer-motion`; Excel export (Data Center page): `xlsx`.
- Styling: Tailwind CSS. The brand `primary` color scale is defined in `tailwind.config.js` (currently an amber/orange ramp anchored at `primary-600 = #FFA617` and `primary-700 = #fd9a00`).
- Data and auth: see [Backend / Database](#4-backend--database) above.
