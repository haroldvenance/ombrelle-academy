"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, EyeOff, Trash2, Plus, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QuestionForm from "./QuestionForm";

export default function ActivityEditor({ activity, linked, bank }: { activity: any; linked: any[]; bank: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const cfg = activity.configuration ?? {};
  const [a, setA] = useState({
    title: activity.title,
    description: activity.description ?? "",
    xp_reward: String(activity.xp_reward),
    type: activity.type,
    passing_score: String(cfg.passing_score ?? 70),
    max_attempts: cfg.max_attempts ? String(cfg.max_attempts) : "",
    shuffle_questions: !!cfg.shuffle_questions,
    shuffle_answers: cfg.shuffle_answers !== false,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const linkedIds = new Set(linked.map((l) => l.questions?.id));

  async function save(status?: string) {
    const { error } = await supabase
      .from("activities")
      .update({
        title: a.title,
        description: a.description,
        xp_reward: Number(a.xp_reward),
        type: a.type,
        ...(status ? { status } : {}),
        configuration: {
          ...cfg,
          passing_score: Number(a.passing_score),
          max_attempts: a.max_attempts ? Number(a.max_attempts) : null,
          shuffle_questions: a.shuffle_questions,
          shuffle_answers: a.shuffle_answers,
        },
      })
      .eq("id", activity.id);
    setMsg(error ? error.message : "Modifications enregistrées.");
    router.refresh();
  }

  async function link(qid: string) {
    await supabase.from("activity_questions").insert({ activity_id: activity.id, question_id: qid, position: linked.length + 1 });
    router.refresh();
  }

  async function unlink(id: string) {
    await supabase.from("activity_questions").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900" href={`/admin/formations/${activity.formation_id}`}>
        <ArrowLeft className="h-4 w-4" /> Retour à la formation
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-900">
          Activité <span className="chip">{activity.status}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => save()}>
            <Save className="h-4 w-4" /> Enregistrer
          </button>
          {activity.status === "published" ? (
            <button className="btn btn-secondary btn-sm" onClick={() => save("draft")}>
              <EyeOff className="h-4 w-4" /> Dépublier
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => save("published")}>
              <Eye className="h-4 w-4" /> Publier
            </button>
          )}
        </div>
      </div>

      {msg && (
        <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {msg}
        </p>
      )}

      <div className="card grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="label">Titre</label>
          <input className="input" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Description (optionnelle)</label>
          <textarea className="input" rows={2} value={a.description} onChange={(e) => setA({ ...a, description: e.target.value })} />
        </div>
        <div>
          <label className="label">XP (1ʳᵉ réussite)</label>
          <input className="input" type="number" min="0" value={a.xp_reward} onChange={(e) => setA({ ...a, xp_reward: e.target.value })} />
        </div>
        <div>
          <label className="label">Seuil de réussite (%)</label>
          <input className="input" type="number" min="1" max="100" value={a.passing_score} onChange={(e) => setA({ ...a, passing_score: e.target.value })} />
        </div>
        <div>
          <label className="label">Tentatives max (vide = illimité)</label>
          <input className="input" type="number" min="1" value={a.max_attempts} onChange={(e) => setA({ ...a, max_attempts: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" checked={a.shuffle_questions} onChange={(e) => setA({ ...a, shuffle_questions: e.target.checked })} />
          Mélanger les questions
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" checked={a.shuffle_answers} onChange={(e) => setA({ ...a, shuffle_answers: e.target.checked })} />
          Mélanger les réponses
        </label>
      </div>

      <section className="card space-y-3">
        <h2 className="font-bold text-slate-900">Questions du quiz ({linked.length})</h2>
        {linked.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune question liée pour le moment. Ajoutez-en une ci-dessous.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {linked.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-slate-700">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                    {l.position}
                  </span>
                  {l.questions?.question_text}
                </span>
                <button className="btn btn-danger btn-sm" onClick={() => unlink(l.id)} title="Retirer la question">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <QuestionForm
        formationId={activity.formation_id}
        moduleId={activity.module_id}
        activityId={activity.id}
        nextPosition={linked.length + 1}
        onDone={() => router.refresh()}
      />

      <section className="card space-y-3">
        <h2 className="font-bold text-slate-900">Ajouter depuis la banque</h2>
        {bank.filter((q) => !linkedIds.has(q.id)).length === 0 ? (
          <p className="text-sm text-slate-500">Toutes les questions disponibles sont déjà liées.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {bank
              .filter((q) => !linkedIds.has(q.id))
              .map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-slate-700">{q.question_text}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => link(q.id)}>
                    <Plus className="h-3.5 w-3.5" /> Ajouter
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}