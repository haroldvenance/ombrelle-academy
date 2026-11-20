import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function AppHeader({ profile }: { profile: any }) {
  const supabase = createClient();
  const [{ data: stats }, { count }] = await Promise.all([
    supabase.from("user_stats").select("total_xp, level_number").eq("user_id", profile.id).maybeSingle(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);
  const staff = ["instructor", "admin", "superadmin"].includes(profile.role);
  const links = [
    { href: "/dashboard", label: "Accueil", icon: "🏠" },
    { href: "/formations", label: "Catalogue", icon: "📚" },
    { href: "/leaderboard", label: "Classement", icon: "🏆" },
    { href: "/notifications", label: `Alertes${count ? ` (${count})` : ""}`, icon: "🔔" },
    { href: "/profile", label: "Profil", icon: "👤" },
  ];
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="text-lg font-extrabold text-brand-800">☂️ <span className="hidden sm:inline">OMBRELLE</span></Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">
            {links.map((l) => <Link key={l.href} href={l.href} className="hover:text-brand-800">{l.label}</Link>)}
            {staff && <Link href="/admin" className="rounded-lg bg-accent-100 px-2 py-1 text-accent-700">Admin</Link>}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="chip chip-violet">Niv. {stats?.level_number ?? 1} · {stats?.total_xp ?? 0} XP</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white text-center text-[11px] font-medium text-slate-600 md:hidden">
        {links.map((l) => <Link key={l.href} href={l.href} className="py-2"><div className="text-lg">{l.icon}</div>{l.label.split(" ")[0]}</Link>)}
      </nav>
    </>
  );
}
