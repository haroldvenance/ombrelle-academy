import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import BlockRenderer from "@/components/BlockRenderer";
import LessonComplete from "@/components/LessonComplete";
import { Target, ArrowLeft, ArrowRight } from "lucide-react";

export default async function LessonPage({ params }: { params: { id: string } }) {
  const { user } = await requireUser();
  const supabase = createClient();
  
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, formation_modules(id, title, formation_id, formations(slug, title))")
    .eq("id", params.id)
    .maybeSingle();
    
  if (!lesson) notFound();
  
  const formation = lesson.formation_modules.formations;
  
  const [{ data: siblings }, { data: modules }, { data: prog }, { data: acts }] = await Promise.all([
    supabase.from("lesson_outline").select("id, module_id, position").eq("formation_id", lesson.formation_modules.formation_id),
    supabase.from("formation_modules").select("id, position").eq("formation_id", lesson.formation_modules.formation_id),
    supabase.from("lesson_progress").select("status").eq("user_id", user.id).eq("lesson_id", lesson.id).maybeSingle(),
    supabase.from("activities").select("id, title, xp_reward").eq("lesson_id", lesson.id).eq("status", "published"),
  ]);
  
  const mp = new Map((modules ?? []).map((m: any) => [m.id, m.position]));
  const ordered = [...(siblings ?? [])].sort((a: any, b: any) => (mp.get(a.module_id)! - mp.get(b.module_id)!) || a.position - b.position);
  const i = ordered.findIndex((l: any) => l.id === lesson.id);
  const next = ordered[i + 1];
  const prev = i > 0 ? ordered[i - 1] : null;
  const done = !!prog && ["completed", "mastered"].includes(prog.status);

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link 
          href={`/learning/${formation.slug}`} 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> {formation.title}
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {lesson.formation_modules.title}
        </p>
        <h1 className="text-3xl font-bold text-slate-900">{lesson.title}</h1>
      </div>

      <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-indigo-600">
        <BlockRenderer blocks={lesson.content as any} />
      </div>

      {!!acts?.length && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" /> Mettez en pratique
          </h2>
          <div className="flex flex-wrap gap-3">
            {acts.map((a: any) => (
              <Link 
                key={a.id} 
                href={`/learning/activity/${a.id}`} 
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                {a.title} <span className="ml-2 text-indigo-200 font-normal">+{a.xp_reward} XP</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <LessonComplete lessonId={lesson.id} done={done} nextHref={next ? `/learning/lesson/${next.id}` : `/learning/${formation.slug}`} />

      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        {prev ? (
          <Link className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href={`/learning/lesson/${prev.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Leçon précédente
          </Link>
        ) : <span />}
        
        {next && (
          <Link className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href={`/learning/lesson/${next.id}`}>
            Leçon suivante <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        )}
      </div>
    </article>
  );
}