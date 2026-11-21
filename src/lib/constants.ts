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

/**
 * Pages d'auth publiques : un utilisateur déjà connecté y est redirigé vers
 * /dashboard. `/reinitialiser` n'est volontairement PAS dans cette liste :
 * cette page nécessite une session active (issue de l'OTP).
 */
export const AUTH_PATHS = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
] as const;

export const PROTECTED_PATHS = [
  "/dashboard",
  "/learning",
  "/leaderboard",
  "/profil",
  "/notifications",
  "/admin",
  "/paiement",
  "/revisions",
  "/reinitialiser",
] as const;

export const REDIRECT = {
  login: "/connexion",
  dashboard: "/dashboard",
  suspended: "/suspendu",
  adminHome: "/admin",
} as const;