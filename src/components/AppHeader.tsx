import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import NavLink from "./NavLink";
import {
  Home, BookOpen, Trophy, Bell, User, Shield, Umbrella, Star, Zap,
} from "lucide-react";
import type { Profile } from "@/types";

type Props = {
  profile: Profile;
};

export default async function AppHeader({ profile }: Props) {
  const supabase = createClient();
  const [{ data: stats }, { count }] = await Promise.all([
    supabase
      .from("user_stats")
      .select("total_xp, level_number")
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  const staff = ["instructor", "admin", "superadmin"].includes(profile.role);

  const baseLinks = [
    { href: "/dashboard", label: "Accueil", icon: Home },
    { href: "/formations", label: "Catalogue", icon: BookOpen },
    { href: "/leaderboard", label: "Classement", icon: Trophy },
    { href: "/notifications", label: "Alertes", icon: Bell, badge: count ?? 0 },
    { href: "/profile", label: "Profil", icon: User },
  ];

  const mobileLinks = staff
    ? [...baseLinks, { href: "/admin", label: "Admin", icon: Shield, badge: undefined as number | undefined }]
    : baseLinks;

  const mobileCols = staff ? "grid-cols-6" : "grid-cols-5";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-extrabold text-brand-800 transition-opacity hover:opacity-80"
            aria-label="OMBRELLE Academy — Tableau de bord"
          >
            <Umbrella className="h-5 w-5" />
            <span className="hidden sm:inline">OMBRELLE</span>
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
            {baseLinks.map((l) => (
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
            <span className="chip chip-violet" aria-label={`Niveau ${stats?.level_number ?? 1}`}>
              <Star className="h-3 w-3" aria-hidden="true" />
              Niv. {stats?.level_number ?? 1}
            </span>
            <span className="chip" aria-label={`${stats?.total_xp ?? 0} points d'expérience`}>
              <Zap className="h-3 w-3" aria-hidden="true" />
              {stats?.total_xp ?? 0} XP
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <nav
        aria-label="Navigation mobile"
        className={`fixed inset-x-0 bottom-0 z-30 grid ${mobileCols} border-t border-slate-200 bg-white md:hidden`}
      >
        {mobileLinks.map((l) => (
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