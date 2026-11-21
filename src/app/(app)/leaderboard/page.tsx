import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Medal } from "lucide-react";

export default async function Leaderboard({ searchParams }: { searchParams: { period?: string; formation?: string } }) {
  const supabase = createClient();
  const period = ["week", "month", "all"].includes(searchParams.period ?? "") ? searchParams.period! : "all";
  
  const [{ data: rows }, { data: formations }] = await Promise.all([
    supabase.rpc("get_leaderboard", { p_period: period, p_formation: searchParams.formation ?? null, p_limit: 50 }),
    supabase.from("formations").select("id, title").eq("status", "published"),
  ]);

  const link = (label: string, p: string, f?: string) => {
    const isActive = period === p && (searchParams.formation ?? "") === (f ?? "");
    return (
      <Link 
        key={label} 
        className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          isActive 
            ? "bg-slate-900 text-white" 
            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
        }`} 
        href={`/leaderboard?period=${p}${f ? `&formation=${f}` : ""}`}
      >
        {label}
      </Link>
    );
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-amber-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-slate-400 font-medium w-5 text-center">{rank}</span>;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center justify-center md:justify-start gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          Classement
        </h1>
        <p className="text-sm text-slate-500 mt-1">Basé sur les XP gagnés. Gérez votre visibilité dans vos paramètres.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {link("Général", "all")}
        {link("Cette semaine", "week")}
        {link("Ce mois", "month")}
        {(formations ?? []).map((f: any) => link(f.title, "all", f.id))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {(rows as any[] ?? []).map((r) => (
            <div key={r.user_id} className={`flex items-center justify-between p-4 ${r.is_me ? "bg-indigo-50/50" : "hover:bg-slate-50"}`}>
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {getRankIcon(r.rank)}
                </div>
                <span className={`font-medium ${r.is_me ? "text-indigo-900" : "text-slate-900"}`}>
                  {r.display_name} {r.is_me && <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full ml-2">Vous</span>}
                </span>
              </div>
              <span className="font-semibold text-slate-700">{Number(r.total_xp).toLocaleString("fr-FR")} XP</span>
            </div>
          ))}
          {!rows?.length && (
            <div className="p-8 text-center text-slate-500">
              Aucun classement disponible pour cette période.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}