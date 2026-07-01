export type Role = "main" | "official" | "member";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  region: string | null;
}

export interface Group {
  id: string;
  name: string;
  region: string;
  stage: string;
  official_id: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  national_id: string;
  plate: string;
  status: "active" | "suspended" | "removed";
  joined_at: string;
  target_savings: number;
  target_contributions: number;
}

export interface WeeklyRecord {
  id: string;
  member_id: string;
  group_id: string;
  week_start: string;
  attendance: "present" | "apology" | "absent";
  savings_kes: number;
  contribution_kes: number;
  development_kes: number;
  created_at: string;
}

export interface WelfareEvent {
  id: string;
  group_id: string;
  beneficiary_member_id: string | null;
  category: "death" | "accident" | "illness" | "other";
  title: string;
  details: string | null;
  amount_kes: number;
  collected_kes: number;
  event_date: string;
  created_at: string;
}

export type PaymentSource = "savings" | "mpesa" | "card" | "bank" | "paypal" | "cash";
export type ContributionStatus = "pending" | "approved" | "rejected";

export interface WelfareContribution {
  id: string;
  welfare_event_id: string;
  member_id: string;
  group_id: string;
  amount_kes: number;
  source: PaymentSource;
  status: ContributionStatus;
  notes: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface SavingsAdjustment {
  id: string;
  member_id: string;
  group_id: string;
  amount_kes: number; // negative = deduction, positive = credit
  reason: string;
  welfare_contribution_id: string | null;
  created_at: string;
}

export interface DevelopmentLog {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  amount_kes: number;
  log_date: string;
  created_at: string;
}

export function attendancePct(records: Pick<WeeklyRecord, "attendance">[]): number {
  if (!records.length) return 100;
  const score = records.reduce((s, r) =>
    s + (r.attendance === "present" ? 1 : r.attendance === "apology" ? 0.5 : 0), 0);
  return Math.round((score / records.length) * 100);
}

export function attendanceLevel(pct: number): "good" | "medium" | "poor" {
  if (pct >= 80) return "good";
  if (pct >= 60) return "medium";
  return "poor";
}

export function safePct(value: number, target: number): number {
  if (!target || target <= 0) return 0;
  const pct = Math.round((value / target) * 100);
  return Math.max(0, Math.min(100, pct));
}
