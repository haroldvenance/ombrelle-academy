import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrent() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return profile ? { user, profile: profile as any } : null;
}

export async function requireUser() {
  const c = await getCurrent();
  if (!c) redirect("/connexion");
  if (c.profile.is_suspended) redirect("/suspendu");
  return c;
}

export async function requireStaff() {
  const c = await requireUser();
  if (!["instructor", "admin", "superadmin"].includes(c.profile.role)) redirect("/dashboard");
  return c;
}

export async function requireAdmin() {
  const c = await requireUser();
  if (!["admin", "superadmin"].includes(c.profile.role)) redirect("/admin");
  return c;
}
