## Scope

Real authentication + role separation, expanded tracking categories, and a refined header for BodaLink.

## 1. Enable Lovable Cloud + real auth

- Enable Lovable Cloud (Supabase under the hood).
- Tables (with RLS + grants):
  - `profiles` — id (uuid → auth.users), full_name, phone, region
  - `app_role` enum: `main`, `official`, `member`
  - `user_roles` — (user_id, role) + `has_role()` security-definer function
  - `groups` — id, name, region, stage, official_id
  - `group_members` — id, user_id (nullable for unregistered riders), group_id, name, phone, national_id, plate, status, joined_at
  - `weekly_records` — id, member_id, week_start, attendance ('present'|'apology'|'absent'), savings_kes, contribution_kes, development_kes, recorded_by
  - `welfare_events` — id, group_id, member_id (beneficiary), category ('death'|'accident'|'illness'|'other'), details, amount_kes, event_date, recorded_by
  - `development_logs` — id, group_id, title, description, amount_kes, log_date, recorded_by
- Email/password sign-up + sign-in, with email verification on. No Google for now (can add later).
- Trigger creates a `profiles` row on signup; sign-up form asks for role + (if official/member) group selection. Main-official accounts created by admin-seed migration so anyone can't self-promote.

## 2. Role-gated routes

- `/auth` — public sign-in / sign-up. Sign-up step 1: pick role. Step 2: 
  - Main official: email + verification code (seeded codes per region for demo).
  - Group official: pick group → name → email → password. Becomes pending until approved by main official (or auto-approve for demo).
  - Member: pick group → name + national ID + plate → email → password.
- `_authenticated/route.tsx` (managed gate) protects `/dashboard/*`.
- `dashboard.main.tsx`, `dashboard.official.tsx`, `dashboard.member.tsx` each check role via `has_role()`; mismatched role is redirected.
- Member dashboard only ever shows the signed-in user's own group + own records.
- Official dashboard only shows members of the group the user owns.
- Main official sees all groups and members across regions and can search.

## 3. Group official capabilities

In `dashboard.official.tsx` add tabs/sections:

- **Members** — existing add/suspend/remove.
- **Weekly record** (per member) — attendance, personal savings, mandatory group-development contribution, weekly development levy.
- **Welfare events** — log a welfare case (death/accident/illness/other) with beneficiary, details, amount, date. Visible to all group members.
- **Weekly developments** — log group-wide development activity (title, description, amount, date). Visible to members.

## 4. Member dashboard

`dashboard.member.tsx` shows the signed-in member's:

- Group name + officials' contact card.
- Attendance % (color-coded), personal savings progress, mandatory group-dev progress (all `PercentBar`).
- Recent weekly records table.
- Welfare events feed for the group.
- Weekly development logs feed for the group.

## 5. Header redesign

`AppHeader.tsx`:

- Transparent over the home hero only; solid **green** (savanna `#1f7a3a`-style tone added to the palette) on scroll and on all inner pages.
- Nav links (Home, Features, About, Contact) rendered as ghost-style **buttons**, not plain text — with active state.
- Mobile: same buttons stacked in a sheet.

## 6. Design tokens

Add a `--success`-aligned `--brand-green` token in `src/styles.css` for the solid header, used only on the header chrome (rest of UI stays Kenyan Road palette).

## Technical notes

- Server functions in `src/lib/*.functions.ts` for: list-my-group, list-my-members, record-week, log-welfare, log-development, search-rider (main-official only, gated by `has_role`).
- `requireSupabaseAuth` middleware on every protected fn; `has_role` checks for main-official-only fns.
- Bearer attacher already wired by integration.
- Remove the mock `bodalink-data.ts` localStorage store; keep only types.
- Migration includes a small demo-seed (3 groups + 1 main-official invite code) so the demo still works end-to-end.

## Out of scope (ask later)

- Push/SMS notifications, Mpesa integration, multi-language, mobile app builds.
