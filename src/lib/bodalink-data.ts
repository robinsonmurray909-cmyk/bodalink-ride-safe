// Mock data store for BodaLink demo. Persists in localStorage on the client.
// Replace with Lovable Cloud when ready.

export type Role = "main" | "official" | "member";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  groupId?: string;
}

export interface Group {
  id: string;
  name: string;
  region: string;
  stage: string;
  officialId: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  plate: string;
  groupId: string;
  status: "active" | "suspended" | "removed";
  joinedAt: string;
  attendance: number[]; // last 12 weeks: 1 = present, 0.5 = apology, 0 = absent
  savings: number[];   // weekly savings KES across the year (52)
  targetSavings: number;
}

const REGIONS = ["Nairobi CBD", "Kisumu", "Mombasa", "Nakuru", "Eldoret", "Thika"];
const NAMES = [
  "Brian Otieno", "Kevin Mwangi", "James Kiprop", "Daniel Wekesa", "Peter Njoroge",
  "Samuel Achieng", "Joseph Kamau", "Eric Omondi", "Stephen Mutua", "Felix Wafula",
  "Anthony Kiplagat", "Moses Barasa", "Victor Onyango", "Patrick Karanja", "Dennis Mutiso",
  "George Kibet", "Isaac Owino", "Joshua Maina", "Robert Cheruiyot", "Andrew Mulwa",
];

function rand(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function makePlate(i: number) {
  const letters = "ABCDEFGHJKLMN";
  return `K${letters[i % letters.length]}${letters[(i + 3) % letters.length]} ${100 + (i * 37) % 900}${"PQRSTUVWXYZ"[i % 11]}`;
}

function makeId(i: number) {
  return `${20000000 + i * 12345 % 9999999}`;
}

function generateMembers(groupId: string, region: string, start: number, count: number): Member[] {
  return Array.from({ length: count }).map((_, i) => {
    const seed = start + i;
    const attendance = Array.from({ length: 12 }, (_, w) => {
      const r = rand(seed * 13 + w);
      return r > 0.85 ? 0 : r > 0.7 ? 0.5 : 1;
    });
    const targetSavings = 52000;
    const weekly = Math.round(800 + rand(seed) * 600);
    const weeksElapsed = 34;
    const savings = Array.from({ length: 52 }, (_, w) =>
      w < weeksElapsed ? Math.round(weekly * (0.7 + rand(seed + w) * 0.5)) : 0,
    );
    return {
      id: `m_${groupId}_${i}`,
      name: NAMES[(start + i) % NAMES.length],
      phone: `+2547${10000000 + (seed * 9871) % 89999999}`,
      nationalId: makeId(seed),
      plate: makePlate(seed),
      groupId,
      status: "active" as const,
      joinedAt: `202${3 + (seed % 3)}-0${1 + (seed % 9)}-15`,
      attendance,
      savings,
      targetSavings,
    } as Member;
  }).map((m, i) => {
    const r = rand(start + i + 99);
    return { ...m, status: r > 0.95 ? "suspended" : "active" } as Member;
  });
}

export const SEED_GROUPS: Group[] = [
  { id: "g1", name: "Tom Mboya Stage Riders", region: REGIONS[0], stage: "Tom Mboya St", officialId: "u_official_1" },
  { id: "g2", name: "Kondele Boda Sacco", region: REGIONS[1], stage: "Kondele Roundabout", officialId: "u_official_2" },
  { id: "g3", name: "Likoni Ferry Riders", region: REGIONS[2], stage: "Likoni Stage", officialId: "u_official_3" },
  { id: "g4", name: "Nakuru CBD Welfare", region: REGIONS[3], stage: "Kenyatta Avenue", officialId: "u_official_4" },
];

export const SEED_MEMBERS: Member[] = [
  ...generateMembers("g1", REGIONS[0], 0, 14),
  ...generateMembers("g2", REGIONS[1], 14, 11),
  ...generateMembers("g3", REGIONS[2], 25, 9),
  ...generateMembers("g4", REGIONS[3], 34, 12),
];

export const SEED_USERS: User[] = [
  { id: "u_main", name: "Inspector Wanjiku", phone: "+254700000001", role: "main" },
  { id: "u_official_1", name: "Chair James Mwangi", phone: "+254700000010", role: "official", groupId: "g1" },
  { id: "u_official_2", name: "Chair Ouma Otieno", phone: "+254700000011", role: "official", groupId: "g2" },
  { id: "u_official_3", name: "Chair Salim Juma", phone: "+254700000012", role: "official", groupId: "g3" },
  { id: "u_official_4", name: "Chair Lydia Cheptoo", phone: "+254700000013", role: "official", groupId: "g4" },
  // member account tied to first member of g1
  { id: "u_member", name: SEED_MEMBERS[0].name, phone: SEED_MEMBERS[0].phone, role: "member", groupId: "g1" },
];

const LS_KEY = "bodalink_state_v1";
const SESSION_KEY = "bodalink_session_v1";

interface State { members: Member[]; groups: Group[]; }

function load(): State {
  if (typeof window === "undefined") return { members: SEED_MEMBERS, groups: SEED_GROUPS };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const init = { members: SEED_MEMBERS, groups: SEED_GROUPS };
  localStorage.setItem(LS_KEY, JSON.stringify(init));
  return init;
}

function save(s: State) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export const store = {
  getAll() { return load(); },
  getGroups() { return load().groups; },
  getMembers() { return load().members; },
  getMembersByGroup(gid: string) { return load().members.filter(m => m.groupId === gid); },
  getMember(id: string) { return load().members.find(m => m.id === id); },
  getGroup(id: string) { return load().groups.find(g => g.id === id); },
  addMember(m: Omit<Member, "id" | "attendance" | "savings" | "targetSavings" | "status" | "joinedAt">) {
    const s = load();
    const newMember: Member = {
      ...m,
      id: `m_${m.groupId}_${Date.now()}`,
      status: "active",
      joinedAt: new Date().toISOString().slice(0, 10),
      attendance: Array(12).fill(1),
      savings: Array(52).fill(0),
      targetSavings: 52000,
    };
    s.members.push(newMember);
    save(s);
    return newMember;
  },
  updateMemberStatus(id: string, status: Member["status"]) {
    const s = load();
    const m = s.members.find(x => x.id === id);
    if (m) { m.status = status; save(s); }
  },
};

export const session = {
  get(): User | null {
    if (typeof window === "undefined") return null;
    try { const raw = sessionStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  set(u: User) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)); },
  clear() { sessionStorage.removeItem(SESSION_KEY); },
};

export function attendanceRate(m: Member): number {
  const sum = m.attendance.reduce((a, b) => a + b, 0);
  return Math.round((sum / m.attendance.length) * 100);
}

export function attendanceLevel(rate: number): "good" | "medium" | "poor" {
  if (rate >= 80) return "good";
  if (rate >= 60) return "medium";
  return "poor";
}

export function savingsTotal(m: Member): number {
  return m.savings.reduce((a, b) => a + b, 0);
}

export function savingsProgress(m: Member): number {
  return Math.min(100, Math.round((savingsTotal(m) / m.targetSavings) * 100));
}
