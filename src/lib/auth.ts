import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isStaffRole, isAdminRole,
  type StaffRole, type AdminRole,
  REDIRECT,
} from "@/lib/constants";
import type { Profile } from "@/types";

export type AuthContext = {
  user: { id: string; email?: string };
  profile: Profile;
};

export type StaffAuthContext = Omit<AuthContext, "profile"> & {
  profile: Omit<Profile, "role"> & { role: StaffRole };
};

export type AdminAuthContext = Omit<AuthContext, "profile"> & {
  profile: Omit<Profile, "role"> & { role: AdminRole };
};

export async function getCurrent(): Promise<AuthContext | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return { user: { id: user.id, email: user.email }, profile: profile as Profile };
}

export async function requireUser(): Promise<AuthContext> {
  const c = await getCurrent();
  if (!c) redirect(REDIRECT.login);
  if (c.profile.is_suspended) redirect(REDIRECT.suspended);
  return c;
}

export async function requireStaff(): Promise<StaffAuthContext> {
  const c = await requireUser();
  if (!isStaffRole(c.profile.role)) redirect(REDIRECT.dashboard);
  return c as StaffAuthContext;
}

export async function requireAdmin(): Promise<AdminAuthContext> {
  const c = await requireUser();
  if (isAdminRole(c.profile.role)) return c as AdminAuthContext;
  // Un instructeur est redirigé vers son hub admin (où il a des droits limités)
  // Un étudiant est redirigé vers son dashboard.
  if (isStaffRole(c.profile.role)) redirect(REDIRECT.adminHome);
  redirect(REDIRECT.dashboard);
}

export async function requireSuperAdmin(): Promise<AdminAuthContext & { profile: Omit<Profile, "role"> & { role: "superadmin" } }> {
  const c = await requireUser();
  if (c.profile.role !== "superadmin") {
    if (isAdminRole(c.profile.role)) redirect(REDIRECT.adminHome);
    if (isStaffRole(c.profile.role)) redirect(REDIRECT.adminHome);
    redirect(REDIRECT.dashboard);
  }
  return c as any;
}