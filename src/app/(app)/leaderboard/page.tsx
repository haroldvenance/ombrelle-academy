import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Leaderboard({ searchParams }: { searchParams: { period?: string; formation?: string } }) {
  const supabase = createClient();
  const period = ["week", "month", "all"].includes(searchParams.period ?? "") ? searchParams.period! : "all";
  const [{ data: rows }, { data: formations }] = await Promise.all([
    supabase.rpc("get_leaderboard", { p_period: period, p_formation: searchParams.formation ?? null, p_limit: 50 }),
    supabase.from("formations").select("id, title").eq("status", "published"),
  ]);
  const link = (label: string, p: string, f?: string) => <Link key={label} className={`chip ${period === p && (searchParams.formation ?? "") === (f ?? "") ? "!bg-brand-700 !text-white" : ""}`} href={`/leaderboard?period=${p}${f ? `&formation=${f}` : ""}`}>{label}</Link>;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-brand-900">🏆 Classement</h1>
      <p className="text-xs text-slate-500">Basé uniquement sur les XP gagnés. Tu peux masquer ton profil dans tes paramètres.</p>
      <div className="flex flex-wrap gap-2">{link("Général", "all")}{link("Semaine", "week")}{link("Mois", "month")}{(formations ?? []).map((f: any) => link(f.title, "all", f.id))}</div>
      <div className="card divide-y divide-slate-100 !p-0">
        {(rows as any[] ?? []).map((r) => (
          <div key={r.user_id} className={`flex items-center justify-between px-4 py-3 ${r.is_me ? "bg-brand-50 font-semibold" : ""}`}>
            <span>{r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : `${r.rank}.`} {r.display_name}{r.is_me ? " (toi)" : ""}</span><span>{Number(r.total_xp).toLocaleString("fr-FR")} XP</span>
          </div>
        ))}
        {!rows?.length && <p className="p-4 text-sm text-slate-500">Aucun classement pour le moment.</p>}
      </div>
    </div>
  );
}
