import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ProgressBar";
import { levelProgress } from "@/lib/gamification";
import { MODE_LABEL } from "@/lib/utils";

export default async function Dashboard() {
  const { user, profile } = await requireUser();
  const supabase = createClient();
  const [{ data: stats }, { data: levels }, { data: streak }, { data: enrollments }, { data: badges }, { count: due }, { data: lp }] = await Promise.all([
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("levels").select("*"),
    supabase.from("user_streaks").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("enrollments").select("*, formations(id, title, slug, cover_image)").eq("user_id", user.id).neq("status", "cancelled"),
    supabase.from("user_badges").select("earned_at, badges(name, description)").eq("user_id", user.id).order("earned_at", { ascending: false }).limit(6),
    supabase.from("review_items").select("id", { count: "exact", head: true }).eq("user_id", user.id).lte("next_review_at", new Date().toISOString()),
    supabase.from("lesson_progress").select("lesson_id, status, completed_at").eq("user_id", user.id),
  ]);
  const xp = stats?.total_xp ?? 0;
  const lv = levelProgress(xp, (levels as any) ?? [{ level_number: 1, name: "Débutant", required_xp: 0 }]);
  const done = new Set((lp ?? []).filter((x: any) => ["completed", "mastered"].includes(x.status)).map((x: any) => x.lesson_id));

  const activeIds = (enrollments ?? []).filter((e: any) => ["active", "completed"].includes(e.status)).map((e: any) => e.formation_id);
  const { data: outline } = activeIds.length ? await supabase.from("lesson_outline").select("id, formation_id, module_id, title, position").in("formation_id", activeIds) : { data: [] as any[] };
  const { data: modules } = activeIds.length ? await supabase.from("formation_modules").select("id, position").in("formation_id", activeIds) : { data: [] as any[] };
  const modPos = new Map((modules ?? []).map((m: any) => [m.id, m.position]));

  // Mission du jour : premier quiz non réussi d'une formation active
  let mission: any = null;
  if (activeIds.length) {
    const [{ data: acts }, { data: passed }] = await Promise.all([
      supabase.from("activities").select("id, title, xp_reward, formation_id").in("formation_id", activeIds).eq("status", "published").order("position"),
      supabase.from("activity_attempts").select("activity_id").eq("user_id", user.id).eq("status", "passed"),
    ]);
    const p = new Set((passed ?? []).map((x: any) => x.activity_id));
    mission = (acts ?? []).find((a: any) => !p.has(a.id)) ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Salut {profile.full_name?.split(" ")[0] ?? ""} 👋</h1>
          <p className="text-sm text-slate-500">Niveau {lv.current.level_number} · {lv.current.name} · {xp} XP</p>
        </div>
        <div className="flex gap-3 text-center text-sm">
          <div className="rounded-xl bg-amber-50 px-4 py-2"><div className="text-xl font-bold">🔥 {streak?.current_streak ?? 0}</div>série</div>
          <div className="rounded-xl bg-accent-50 px-4 py-2"><div className="text-xl font-bold">⭐ {xp}</div>XP</div>
        </div>
        <div className="w-full">
          <ProgressBar value={lv.pct} />
          <p className="mt-1 text-xs text-slate-500">{lv.next ? `${lv.remaining} XP avant « ${lv.next.name} »` : "Niveau maximum atteint 🏆"}</p>
        </div>
      </div>

      {mission && (
        <div className="card border-accent-500 bg-gradient-to-r from-accent-50 to-white">
          <div className="text-xs font-bold uppercase tracking-wide text-accent-700">Mission du jour</div>
          <p className="mt-1 font-semibold">Réussir : {mission.title}</p>
          <p className="text-sm text-slate-600">Récompense : {mission.xp_reward} XP</p>
          <Link href={`/learning/activity/${mission.id}`} className="btn btn-accent mt-3">Commencer</Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-xl font-bold text-brand-900">Mes formations</h2>
        {!enrollments?.length && <div className="card text-slate-600">Tu n&apos;es inscrit à aucune formation. <Link className="font-semibold text-brand-700 underline" href="/formations">Parcourir le catalogue</Link></div>}
        <div className="grid gap-4 sm:grid-cols-2">
          {(enrollments ?? []).map((e: any) => {
            const lessons = (outline ?? []).filter((l: any) => l.formation_id === e.formation_id);
            const total = lessons.length; const d = lessons.filter((l: any) => done.has(l.id)).length;
            const pct = total ? Math.round((d / total) * 100) : 0;
            const active = ["active", "completed"].includes(e.status);
            return (
              <div key={e.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-brand-900">{e.formations?.title}</h3><span className="chip">{MODE_LABEL[e.learning_mode]}</span></div>
                {active ? <><ProgressBar value={pct} /><p className="text-xs text-slate-500">{d}/{total} leçons · {pct} %</p>
                  <Link className="btn btn-primary btn-sm" href={`/learning/${e.formations?.slug}`}>{e.status === "completed" ? "Revoir" : "Continuer"}</Link></>
                : <><p className="text-sm text-amber-700">Accès en attente (paiement {e.payment_status === "pending" ? "à soumettre / en vérification" : e.payment_status}).</p><Link className="btn btn-accent btn-sm" href={`/paiement/${e.id}`}>Paiement</Link></>}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card"><h2 className="mb-2 font-bold text-brand-900">Badges récents</h2>
          {!badges?.length ? <p className="text-sm text-slate-500">Termine ta première leçon pour débloquer « Premier pas » !</p> :
            <ul className="space-y-1 text-sm">{badges.map((b: any, i: number) => <li key={i}>🏅 <b>{b.badges?.name}</b> — {b.badges?.description}</li>)}</ul>}
        </section>
        <section className="card"><h2 className="mb-2 font-bold text-brand-900">Révisions</h2>
          <p className="text-sm text-slate-600">{due ? `${due} question(s) à revoir aujourd'hui.` : "Rien à réviser pour le moment."}</p>
          <p className="mt-1 text-xs text-slate-400">Les questions ratées reviennent selon un calendrier de répétition espacée.</p></section>
      </div>
    </div>
  );
}
