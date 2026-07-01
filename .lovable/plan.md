
You said yes to all four items. Items 1 and 2 are safe to ship together this round. Items 3 (real payment gateways) and 4 (multi-region schema) each need their own round because they change money handling and the database shape — rushing them together will break the working parts. Here is how I will phase it.

## Round A — ship now (this turn)

### 1. Fix the member % bug
Symptom: after an official records a member's savings/group-dev, the member dashboard shows KES totals but the progress bar stays at 0%.
Cause: `target_savings` and `target_contributions` are `0` for members added through the official form (we never asked for a target), so `savings / 0` collapses to 0%.
Fix:
- Migration: set sensible non-zero defaults (`target_savings` default 10000, `target_contributions` default 5000) and backfill any existing `0` values.
- `addMember` form on the official dashboard: add optional "Savings target" and "Group-dev target" inputs (pre-filled with the defaults).
- `PercentBar` math: guard against divide-by-zero and clamp.

### 2. Group-wide totals on the official + main dashboards
New summary strip at the top of `dashboard.official.tsx`:
- Active members count
- Total group savings (sum of `savings_kes`)
- Total group-dev fund (sum of `contribution_kes` — the mandatory welfare/dev pot)
- Total weekly-dev levy (sum of `development_kes`)
- Weekly records logged (count)
- Welfare paid out (sum of `welfare_events.amount_kes`)
- "Fund available" = group-dev fund − welfare paid out
Same strip on `dashboard.main.tsx`, aggregated across all groups the main official oversees, plus a per-group breakdown table.

### 3. Welfare "Pay from savings" flow (in-app only, no external gateway yet)
New table `welfare_contributions` (member_id, welfare_event_id, amount_kes, source enum: `savings`|`mpesa`|`card`|`bank`|`paypal`|`cash`, status enum: `pending`|`approved`|`rejected`, requested_at, approved_by, approved_at).
Member dashboard: each welfare case gets a **Pay** button → modal asking amount + source. For `source = savings`, submits a pending request.
Official dashboard: new "Pending welfare payments" panel → Approve/Reject. On approve:
- Insert a negative `weekly_records`-style savings adjustment (or a dedicated `savings_adjustments` row) so the member's savings total drops.
- Mark contribution `approved`.
- Increment welfare event's collected amount (new column `collected_kes`).
Other sources (mpesa/card/etc.) are accepted as **manual entries only** in this round — the official records "member paid KES X via M-Pesa" and it goes straight to approved. No real gateway call yet.

## Round B — real payment gateways (separate turn)
This needs its own round because it touches money and each provider has its own onboarding.
- M-Pesa Daraja (STK Push): requires you to register a Safaricom developer account, get Consumer Key/Secret, Passkey, Shortcode. I will store them as secrets and add a server route + callback URL. Sandbox first.
- Card / Apple Pay / Google Pay: enable Lovable Payments (Stripe seamless). This is the recommended path — no Stripe account needed to start in sandbox, and it handles tax + disputes.
- PayPal / bank transfer: manual recording only (no auto-reconciliation), unless you want a full PayPal integration later.
When you're ready, say "start payments round" and tell me which country your M-Pesa shortcode is registered in.

## Round C — multi-region architecture (separate turn)
Region → Groups → Members hierarchy with main-official scoped per region. This is a schema change and needs its own migration + UI pass.
- New `regions` table (name, code, country).
- `groups.region_id` FK to `regions` (replaces the free-text `region` column).
- `region_officials` join table (`user_id`, `region_id`) — a main official can cover multiple regions.
- Per-region invite codes stored in `regions.invite_code` (rotatable), replacing the single global `BODALINK-MAIN-2026`.
- Public per-group signup link: `/join/:groupId` (already routable) with a per-group `join_code` on `groups`.
- Main-official dashboard filters by their `region_officials` scope; RLS updated with a `has_region_access(user_id, region_id)` helper.
- Migration includes a data move: put every existing group into a default region so nothing breaks.

## Technical notes (Round A)
Files changed:
- Migration: add `welfare_contributions`, `savings_adjustments`, `groups.collected_kes`, defaults + backfill for member targets, RLS + GRANTs.
- `src/lib/bodalink.functions.ts`: `getOfficialOverview` returns aggregate totals; add `requestWelfarePayment`, `approveWelfarePayment`, `rejectWelfarePayment`, `recordExternalWelfarePayment`.
- `src/lib/bodalink-types.ts`: new `WelfareContribution`, `SavingsAdjustment` types; extend `WelfareEvent` with `collected_kes`.
- `src/routes/_authenticated/dashboard.official.tsx`: totals strip, member-add form with targets, pending-welfare-payments panel, external-payment recorder.
- `src/routes/_authenticated/dashboard.member.tsx`: totals now use guarded math (already renders KES but % was stuck at 0); Pay button + modal per welfare case; "My pending welfare payments" section.
- `src/routes/_authenticated/dashboard.main.tsx`: aggregate totals across groups + per-group breakdown table.
- `src/components/PercentBar.tsx`: divide-by-zero guard.

Out of scope this round: real payment gateways (Round B), region hierarchy + per-group invite links (Round C). Both will be picked up in follow-up rounds when you're ready.
