"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuestionForm from "./QuestionForm";

export default function ActivityEditor({ activity, linked, bank }: { activity: any; linked: any[]; bank: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const cfg = activity.configuration ?? {};
  const [a, setA] = useState({ title: activity.title, description: activity.description ?? "", xp_reward: String(activity.xp_reward), type: activity.type,
    passing_score: String(cfg.passing_score ?? 70), max_attempts: cfg.max_attempts ? String(cfg.max_attempts) : "", shuffle_questions: !!cfg.shuffle_questions, shuffle_answers: cfg.shuffle_answers !== false });
  const [msg, setMsg] = useState<string | null>(null);
  const linkedIds = new Set(linked.map((l) => l.questions?.id));

  async function save(status?: string) {
    const { error } = await supabase.from("activities").update({
      title: a.title, description: a.description, xp_reward: Number(a.xp_reward), type: a.type, ...(status ? { status } : {}),
      configuration: { ...cfg, passing_score: Number(a.passing_score), max_attempts: a.max_attempts ? Number(a.max_attempts) : null, shuffle_questions: a.shuffle_questions, shuffle_answers: a.shuffle_answers },
    }).eq("id", activity.id);
    setMsg(error ? error.message : "Enregistré."); router.refresh();
  }
  async function link(qid: string) { await supabase.from("activity_questions").insert({ activity_id: activity.id, question_id: qid, position: linked.length + 1 }); router.refresh(); }
  async function unlink(id: string) { await supabase.from("activity_questions").delete().eq("id", id); router.refresh(); }

  return (
    <div className="space-y-5">
      <Link className="text-sm text-brand-700" href={`/admin/formations/${activity.formation_id}`}>← Formation</Link>
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl font-bold text-brand-900">Activité <span className="chip">{activity.status}</span></h1>
        <div className="flex gap-2"><button className="btn btn-secondary btn-sm" onClick={() => save()}>Enregistrer</button>
          {activity.status === "published" ? <button className="btn btn-secondary btn-sm" onClick={() => save("draft")}>Dépublier</button> : <button className="btn btn-primary btn-sm" onClick={() => save("published")}>Publier</button>}</div></div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <div className="card grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3"><label className="label">Titre</label><input className="input" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} /></div>
        <div><label className="label">XP (1ʳᵉ réussite)</label><input className="input" type="number" min="0" value={a.xp_reward} onChange={(e) => setA({ ...a, xp_reward: e.target.value })} /></div>
        <div><label className="label">Seuil de réussite (%)</label><input className="input" type="number" min="1" max="100" value={a.passing_score} onChange={(e) => setA({ ...a, passing_score: e.target.value })} /></div>
        <div><label className="label">Tentatives max (vide = illimité)</label><input className="input" type="number" min="1" value={a.max_attempts} onChange={(e) => setA({ ...a, max_attempts: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={a.shuffle_questions} onChange={(e) => setA({ ...a, shuffle_questions: e.target.checked })} />Mélanger les questions</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={a.shuffle_answers} onChange={(e) => setA({ ...a, shuffle_answers: e.target.checked })} />Mélanger les réponses</label>
      </div>
      <section className="card space-y-2"><h2 className="font-bold">Questions du quiz ({linked.length})</h2>
        <ul className="divide-y divide-slate-100 text-sm">{linked.map((l) => <li key={l.id} className="flex items-center justify-between gap-2 py-2"><span>{l.position}. {l.questions?.question_text}</span><button className="btn btn-danger btn-sm" onClick={() => unlink(l.id)}>Retirer</button></li>)}</ul></section>
      <QuestionForm formationId={activity.formation_id} moduleId={activity.module_id} activityId={activity.id} nextPosition={linked.length + 1} onDone={() => router.refresh()} />
      <section className="card space-y-2"><h2 className="font-bold">Ajouter depuis la banque</h2>
        <ul className="divide-y divide-slate-100 text-sm">{bank.filter((q) => !linkedIds.has(q.id)).map((q) => <li key={q.id} className="flex items-center justify-between gap-2 py-2"><span>{q.question_text}</span><button className="btn btn-secondary btn-sm" onClick={() => link(q.id)}>+ Ajouter</button></li>)}</ul></section>
    </div>
  );
}
