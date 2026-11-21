import type { Role } from "@/types";

export const ALL_ROLES: Role[] = ["student", "instructor", "admin", "superadmin"];
export const STAFF_ROLES = ["instructor", "admin", "superadmin"] as const;
export const ADMIN_ROLES = ["admin", "superadmin"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === "string" && (STAFF_ROLES as readonly string[]).includes(role);
}

export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && (ADMIN_ROLES as readonly string[]).includes(role);
}

export const AUTH_PATHS = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reset-password",
] as const;

export const PROTECTED_PATHS = [
  "/dashboard",
  "/learning",
  "/leaderboard",
  "/profile",
  "/notifications",
  "/admin",
  "/paiement",
  "/revisions", // à venir (session de révision espacée)
] as const;

export const REDIRECT = {
  login: "/connexion",
  dashboard: "/dashboard",
  suspended: "/suspendu",
  adminHome: "/admin",
} as const;