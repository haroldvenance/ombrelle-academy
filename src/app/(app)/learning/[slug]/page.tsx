import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ProgressBar";
import ModePicker from "@/components/ModePicker";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const { user } = await requireUser();
  const supabase = createClient();
  const { data: f } = await supabase.from("formations").select("*").eq("slug", params.slug).maybeSingle();
  if (!f) notFound();
  const { data: enr } = await supabase.from("enrollments").select("*").eq("user_id", user.id).eq("formation_id", f.id).neq("status", "cancelled").maybeSingle();
  if (!enr) redirect(`/formations/${f.slug}`);
  if (!["active", "completed"].includes(enr.status)) redirect(`/paiement/${enr.id}`);

  const [{ data: modules }, { data: lessons }, { data: lp }, { data: acts }, { data: passed }] = await Promise.all([
    supabase.from("formation_modules").select("*").eq("formation_id", f.id).order("position"),
    supabase.from("lesson_outline").select("*").eq("formation_id", f.id).order("position"),
    supabase.from("lesson_progress").select("lesson_id, status").eq("user_id", user.id),
    supabase.from("activities").select("*").eq("formation_id", f.id).eq("status", "published").order("position"),
    supabase.from("activity_attempts").select("activity_id").eq("user_id", user.id).eq("status", "passed"),
  ]);
  const done = new Set((lp ?? []).filter((x: any) => ["completed", "mastered"].includes(x.status)).map((x: any) => x.lesson_id));
  const passedSet = new Set((passed ?? []).map((x: any) => x.activity_id));
  const total = lessons?.length ?? 0; const d = (lessons ?? []).filter((l: any) => done.has(l.id)).length;
  const pct = total ? Math.round((d / total) * 100) : 0;
  // Même contenu, mode différent : on filtre les activités facultatives selon le mode (configuration.modes)
  const visibleActs = (acts ?? []).filter((a: any) => !a.configuration?.modes || a.configuration.modes.includes(enr.learning_mode));

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <Link href="/dashboard" className="text-sm text-brand-700">← Tableau de bord</Link>
        <h1 className="text-2xl font-bold text-brand-900">{f.title}</h1>
        <ProgressBar value={pct} /><p className="text-xs text-slate-500">{d}/{total} leçons terminées · {pct} %</p>
        <ModePicker enrollmentId={enr.id} current={enr.learning_mode} />
      </div>
      {(modules ?? []).map((m: any, i: number) => (
        <section key={m.id} className="card space-y-3">
          <h2 className="font-bold text-brand-900">Module {i + 1} — {m.title}</h2>
          <ul className="divide-y divide-slate-100">
            {(lessons ?? []).filter((l: any) => l.module_id === m.id).map((l: any) => (
              <li key={l.id}><Link href={`/learning/lesson/${l.id}`} className="flex items-center justify-between gap-2 py-3 hover:text-brand-700">
                <span>{done.has(l.id) ? "✅" : "📖"} {l.title}</span><span className="text-xs text-slate-400">{l.estimated_duration ? `${l.estimated_duration} min` : ""}</span></Link></li>
            ))}
            {visibleActs.filter((a: any) => a.module_id === m.id).map((a: any) => (
              <li key={a.id}><Link href={`/learning/activity/${a.id}`} className="flex items-center justify-between gap-2 py-3 text-accent-700 hover:text-accent-600">
                <span>{passedSet.has(a.id) ? "✅" : "🎯"} {a.title}</span><span className="text-xs">{a.xp_reward} XP</span></Link></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
