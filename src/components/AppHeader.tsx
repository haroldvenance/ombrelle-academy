import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import NavLink from "./NavLink";
import {
  Home, BookOpen, Trophy, Bell, User, Shield, Umbrella, Star, Zap,
} from "lucide-react";

export default async function AppHeader({ profile }: { profile: any }) {
  const supabase = createClient();
  const [{ data: stats }, { count }] = await Promise.all([
    supabase.from("user_stats").select("total_xp, level_number").eq("user_id", profile.id).maybeSingle(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

  const staff = ["instructor", "admin", "superadmin"].includes(profile.role);

  const links = [
    { href: "/dashboard", label: "Accueil", icon: Home },
    { href: "/formations", label: "Catalogue", icon: BookOpen },
    { href: "/leaderboard", label: "Classement", icon: Trophy },
    { href: "/notifications", label: "Alertes", icon: Bell, badge: count ?? 0 },
    { href: "/profile", label: "Profil", icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-extrabold text-brand-800 transition-opacity hover:opacity-80"
          >
            <Umbrella className="h-5 w-5" />
            <span className="hidden sm:inline">OMBRELLE</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                label={l.label}
                icon={<l.icon className="h-4 w-4" />}
                badge={l.badge}
              />
            ))}
            {staff && (
              <NavLink
                href="/admin"
                label="Admin"
                icon={<Shield className="h-4 w-4" />}
                activeColor="accent"
              />
            )}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <span className="chip chip-violet">
              <Star className="h-3 w-3" />
              Niv. {stats?.level_number ?? 1}
            </span>
            <span className="chip">
              <Zap className="h-3 w-3" />
              {stats?.total_xp ?? 0} XP
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
        {links.map((l) => (
          <NavLink
            key={l.href}
            href={l.href}
            label={l.label}
            icon={<l.icon className="mx-auto h-5 w-5" />}
            badge={l.badge}
          />
        ))}
      </nav>
    </>
  );
}