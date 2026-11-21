import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ProgressBar";
import { levelProgress } from "@/lib/gamification";
import { MODE_LABEL } from "@/lib/utils";
import {
  Flame, Star, Trophy, Target, BookOpen, Clock, Award, ArrowRight, PlayCircle,
} from "lucide-react";

export default async function Dashboard() {
  const { user, profile } = await requireUser();
  const supabase = createClient();

  const [
    { data: stats },
    { data: levels },
    { data: streak },
    { data: enrollments },
    { data: badges },
    { data: dueCount },     // ← RPC get_review_due_count (int)
    { data: lp },
  ] = await Promise.all([
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("levels").select("*"),
    supabase.from("user_streaks").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("enrollments")
      .select("*, formations(id, title, slug, cover_image)")
      .eq("user_id", user.id)
      .neq("status", "cancelled"),
    supabase
      .from("user_badges")
      .select("earned_at, badges(name, description)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .limit(3),
    supabase.rpc("get_review_due_count"),
    supabase
      .from("lesson_progress")
      .select("lesson_id, status, completed_at")
      .eq("user_id", user.id),
  ]);

  const xp = stats?.total_xp ?? 0;
  const lv = levelProgress(
    xp,
    (levels as any) ?? [{ level_number: 1, name: "Débutant", required_xp: 0 }]
  );
  const due = (dueCount as number | null) ?? 0;

  const done = new Set(
    (lp ?? [])
      .filter((x: any) => ["completed", "mastered"].includes(x.status))
      .map((x: any) => x.lesson_id)
  );

  const activeIds = (enrollments ?? [])
    .filter((e: any) => ["active", "completed"].includes(e.status))
    .map((e: any) => e.formation_id);

  const { data: outline } = activeIds.length
    ? await supabase
        .from("lesson_outline")
        .select("id, formation_id, module_id, title, position")
        .in("formation_id", activeIds)
    : { data: [] as any[] };

  // ── Mission du jour (première activité non validée) ──────────
  let mission: any = null;
  if (activeIds.length) {
    const [{ data: acts }, { data: passed }] = await Promise.all([
      supabase
        .from("activities")
        .select("id, title, xp_reward, formation_id")
        .in("formation_id", activeIds)
        .eq("status", "published")
        .order("position"),
      supabase
        .from("activity_attempts")
        .select("activity_id")
        .eq("user_id", user.id)
        .eq("status", "passed"),
    ]);
    const p = new Set((passed ?? []).map((x: any) => x.activity_id));
    mission = (acts ?? []).find((a: any) => !p.has(a.id)) ?? null;
  }

  return (
    <div className="space-y-8">
      {/* ── En-tête ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bonjour, {profile.full_name?.split(" ")[0] ?? "Étudiant"}
          </h1>
          <p className="text-slate-500 mt-1">
            Niveau {lv.current.level_number} · {lv.current.name}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2 border border-orange-100 text-orange-700">
            <Flame className="h-5 w-5" />
            <span className="font-semibold">{streak?.current_streak ?? 0} jours</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 border border-indigo-100 text-indigo-700">
            <Star className="h-5 w-5" />
            <span className="font-semibold">{xp} XP</span>
          </div>
        </div>
      </div>

      {/* ── Barre d'XP ─────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">
            Progression vers le niveau {lv.next?.level_number ?? "max"}
          </span>
          <span className="text-slate-500">
            {lv.isMax ? "Niveau maximum atteint" : `${lv.remaining} XP restants`}
          </span>
        </div>
        <ProgressBar value={lv.pct} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Colonne principale ───────────────────────────── */}
        <div className="md:col-span-2 space-y-6">
          {mission && (
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-md mb-3">
                  <Target className="h-3 w-3" /> Mission du jour
                </span>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{mission.title}</h2>
                <p className="text-sm text-slate-600 mb-6 flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500" /> Récompense : {mission.xp_reward} XP
                </p>
                <Link
                  href={`/learning/activity/${mission.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <PlayCircle className="h-4 w-4" /> Commencer l&apos;activité
                </Link>
              </div>
            </div>
          )}

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Mes formations</h2>
            {!enrollments?.length ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                <p>Vous n&apos;êtes inscrit à aucune formation.</p>
                <Link
                  className="text-indigo-600 font-medium hover:underline mt-2 inline-block"
                  href="/formations"
                >
                  Parcourir le catalogue
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(enrollments ?? []).map((e: any) => {
                  const lessons = (outline ?? []).filter(
                    (l: any) => l.formation_id === e.formation_id
                  );
                  const total = lessons.length;
                  const d = lessons.filter((l: any) => done.has(l.id)).length;
                  const pct = total ? Math.round((d / total) * 100) : 0;
                  const active = ["active", "completed"].includes(e.status);

                  return (
                    <div
                      key={e.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 leading-tight">
                            {e.formations?.title}
                          </h3>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 whitespace-nowrap">
                            {MODE_LABEL[e.learning_mode]}
                          </span>
                        </div>
                        {active ? (
                          <div className="mt-4 space-y-2">
                            <ProgressBar value={pct} />
                            <p className="text-xs text-slate-500">
                              {d}/{total} leçons complétées
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-lg bg-amber-50 p-3 border border-amber-100">
                            <p className="text-xs text-amber-800 font-medium">
                              Accès en attente
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              Paiement{" "}
                              {e.payment_status === "pending"
                                ? "en vérification"
                                : "requis"}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-5">
                        {active ? (
                          <Link
                            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            href={`/learning/${e.formations?.slug}`}
                          >
                            {e.status === "completed"
                              ? "Revoir le cours"
                              : "Continuer le cours"}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : (
                          <Link
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                            href={`/paiement/${e.id}`}
                          >
                            Finaliser le paiement
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Barre latérale ─────────────────────────────── */}
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <h2 className="font-semibold text-slate-900 text-sm">Révisions espacées</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                {due
                  ? `Vous avez ${due} question(s) à réviser aujourd'hui pour ne pas les oublier.`
                  : "Aucune révision prévue aujourd'hui."}
              </p>
              {due ? (
                <Link
                  href="/revisions"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Réviser maintenant
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
                >
                  Tout est à jour
                </button>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-slate-500" />
              <h2 className="font-semibold text-slate-900 text-sm">Derniers badges</h2>
            </div>
            <div className="p-5">
              {!badges?.length ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Terminez votre première leçon pour débloquer un badge.
                </p>
              ) : (
                <ul className="space-y-4">
                  {badges.map((b: any, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-100 p-2 mt-0.5">
                        <Trophy className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {b.badges?.name}
                        </p>
                        <p className="text-xs text-slate-500 leading-snug mt-0.5">
                          {b.badges?.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}