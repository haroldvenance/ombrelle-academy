import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ProgressBar";
import ModePicker from "@/components/ModePicker";
import { ArrowLeft, CheckCircle2, Circle, Target } from "lucide-react";

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
  
  const total = lessons?.length ?? 0; 
  const d = (lessons ?? []).filter((l: any) => done.has(l.id)).length;
  const pct = total ? Math.round((d / total) * 100) : 0;
  
  const visibleActs = (acts ?? []).filter((a: any) => !a.configuration?.modes || a.configuration.modes.includes(enr.learning_mode));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{f.title}</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Progression globale</span>
          <span className="text-slate-500">{d}/{total} leçons terminées ({pct}%)</span>
        </div>
        <ProgressBar value={pct} />
        <div className="pt-4 border-t border-slate-100">
          <ModePicker enrollmentId={enr.id} current={enr.learning_mode} />
        </div>
      </div>

      <div className="space-y-6">
        {(modules ?? []).map((m: any, i: number) => (
          <section key={m.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Module {i + 1} : {m.title}</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {(lessons ?? []).filter((l: any) => l.module_id === m.id).map((l: any) => (
                <li key={l.id}>
                  <Link href={`/learning/lesson/${l.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      {done.has(l.id) ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400" />
                      )}
                      <span className={`text-sm font-medium ${done.has(l.id) ? "text-slate-500" : "text-slate-700"}`}>
                        {l.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{l.estimated_duration ? `${l.estimated_duration} min` : ""}</span>
                  </Link>
                </li>
              ))}
              {visibleActs.filter((a: any) => a.module_id === m.id).map((a: any) => (
                <li key={a.id}>
                  <Link href={`/learning/activity/${a.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-indigo-50/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Target className={`h-5 w-5 ${passedSet.has(a.id) ? "text-indigo-500" : "text-slate-300 group-hover:text-indigo-400"}`} />
                      <span className={`text-sm font-medium ${passedSet.has(a.id) ? "text-slate-500" : "text-indigo-700"}`}>
                        {a.title}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{a.xp_reward} XP</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}