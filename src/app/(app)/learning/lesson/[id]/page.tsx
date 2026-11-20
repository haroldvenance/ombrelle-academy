import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import BlockRenderer from "@/components/BlockRenderer";
import LessonComplete from "@/components/LessonComplete";

export default async function LessonPage({ params }: { params: { id: string } }) {
  const { user } = await requireUser();
  const supabase = createClient();
  const { data: lesson } = await supabase.from("lessons").select("*, formation_modules(id, title, formation_id, formations(slug, title))").eq("id", params.id).maybeSingle();
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
  const done = !!prog && ["completed", "mastered"].includes(prog.status);
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href={`/learning/${formation.slug}`} className="text-sm text-brand-700">← {formation.title}</Link>
      <div><p className="text-xs uppercase tracking-wide text-slate-400">{lesson.formation_modules.title}</p><h1 className="text-3xl font-bold text-brand-900">{lesson.title}</h1></div>
      <BlockRenderer blocks={lesson.content as any} />
      {!!acts?.length && <div className="card space-y-2"><h2 className="font-bold text-brand-900">Mets en pratique</h2>
        {acts.map((a: any) => <Link key={a.id} href={`/learning/activity/${a.id}`} className="btn btn-accent mr-2">🎯 {a.title} (+{a.xp_reward} XP)</Link>)}</div>}
      <LessonComplete lessonId={lesson.id} done={done} nextHref={next ? `/learning/lesson/${next.id}` : `/learning/${formation.slug}`} />
      <div className="flex justify-between text-sm">
        {i > 0 ? <Link className="text-brand-700" href={`/learning/lesson/${ordered[i - 1].id}`}>← Précédente</Link> : <span />}
        {next && <Link className="text-brand-700" href={`/learning/lesson/${next.id}`}>Suivante →</Link>}
      </div>
    </article>
  );
}
