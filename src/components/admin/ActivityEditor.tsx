"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QuestionForm from "./QuestionForm";

export default function ActivityEditor({
  activity,
  linked,
  bank,
}: {
  activity: any;
  linked: any[];
  bank: any[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const cfg = activity.configuration ?? {};

  const [a, setA] = useState({
    title: activity.title,
    description: activity.description ?? "",
    xp_reward: String(activity.xp_reward ?? 0),
    type: activity.type ?? "quiz",
    passing_score: String(cfg.passing_score ?? 70),
    max_attempts: cfg.max_attempts ? String(cfg.max_attempts) : "",
    shuffle_questions: !!cfg.shuffle_questions,
    shuffle_answers: cfg.shuffle_answers !== false,
  });

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  const linkedIds = useMemo(() => new Set(linked.map((l) => l.questions?.id)), [linked]);
  const available = useMemo(() => bank.filter((q) => !linkedIds.has(q.id)), [bank, linkedIds]);

  async function save(status?: string) {
    if (saving) return;
    setSaving(true);
    setMsg(null);

    const passing = Math.max(1, Math.min(100, Number(a.passing_score) || 70));
    const xp = Math.max(0, Number(a.xp_reward) || 0);
    const maxAttempts = a.max_attempts ? Math.max(1, Number(a.max_attempts)) : null;

    const { error } = await supabase
      .from("activities")
      .update({
        title: a.title.trim(),
        description: a.description,
        xp_reward: xp,
        type: a.type,
        ...(status ? { status } : {}),
        configuration: {
          ...cfg,
          passing_score: passing,
          max_attempts: maxAttempts,
          shuffle_questions: a.shuffle_questions,
          shuffle_answers: a.shuffle_answers,
        },
      })
      .eq("id", activity.id);

    setSaving(false);
    setMsg(
      error
        ? { ok: false, text: error.message }
        : { ok: true, text: "Modifications enregistrées." }
    );
    if (!error) router.refresh();
  }

  async function link(qid: string) {
    setLinking(qid);
    // Position = MAX(position) + 1 pour éviter les collisions après suppression
    const maxPos = linked.reduce((m, l) => Math.max(m, l.position ?? 0), 0);
    const { error } = await supabase.from("activity_questions").insert({
      activity_id: activity.id,
      question_id: qid,
      position: maxPos + 1,
    });
    setLinking(null);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg(null);
    router.refresh();
  }

  async function unlink(id: string) {
    const { error } = await supabase
      .from("activity_questions")
      .delete()
      .eq("id", id);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg(null);
    router.refresh();
  }

  async function moveLinked(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= linked.length) return;

    const aL = linked[index];
    const bL = linked[target];
    const tmp = -Math.max(aL.position, bL.position) - 1;

    const { error: e1 } = await supabase
      .from("activity_questions")
      .update({ position: tmp })
      .eq("id", aL.id);
    if (e1) { setMsg({ ok: false, text: e1.message }); return; }

    const { error: e2 } = await supabase
      .from("activity_questions")
      .update({ position: aL.position })
      .eq("id", bL.id);
    if (e2) {
      await supabase.from("activity_questions").update({ position: aL.position }).eq("id", aL.id);
      setMsg({ ok: false, text: e2.message });
      return;
    }

    const { error: e3 } = await supabase
      .from("activity_questions")
      .update({ position: bL.position })
      .eq("id", aL.id);
    if (e3) { setMsg({ ok: false, text: e3.message }); return; }

    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Link
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900"
        href={`/admin/formations/${activity.formation_id}`}
      >
        <ArrowLeft className="h-4 w-4" /> Retour à la formation
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-900">
          Activité <span className="chip">{activity.status}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => save()}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
          {activity.status === "published" ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => save("draft")}
              disabled={saving}
            >
              <EyeOff className="h-4 w-4" /> Dépublier
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => save("published")}
              disabled={saving}
            >
              <Eye className="h-4 w-4" /> Publier et enregistrer
            </button>
          )}
        </div>
      </div>

      {msg && (
        <p
          role="alert"
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {msg.text}
        </p>
      )}

      <div className="card grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="label">Titre</label>
          <input
            className="input"
            value={a.title}
            onChange={(e) => setA({ ...a, title: e.target.value })}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Description (optionnelle)</label>
          <textarea
            className="input"
            rows={2}
            value={a.description}
            onChange={(e) => setA({ ...a, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={a.type}
            onChange={(e) => setA({ ...a, type: e.target.value })}
          >
            <option value="quiz">Quiz</option>
            <option value="exercise">Exercice</option>
            <option value="exam">Examen</option>
          </select>
        </div>
        <div>
          <label className="label">XP (1ʳᵉ réussite)</label>
          <input
            className="input"
            type="number"
            min="0"
            value={a.xp_reward}
            onChange={(e) => setA({ ...a, xp_reward: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Seuil de réussite (%)</label>
          <input
            className="input"
            type="number"
            min="1"
            max="100"
            value={a.passing_score}
            onChange={(e) => setA({ ...a, passing_score: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Tentatives max (vide = illimité)</label>
          <input
            className="input"
            type="number"
            min="1"
            value={a.max_attempts}
            onChange={(e) => setA({ ...a, max_attempts: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
            checked={a.shuffle_questions}
            onChange={(e) => setA({ ...a, shuffle_questions: e.target.checked })}
          />
          Mélanger les questions
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
            checked={a.shuffle_answers}
            onChange={(e) => setA({ ...a, shuffle_answers: e.target.checked })}
          />
          Mélanger les réponses
        </label>
      </div>

      <section className="card space-y-3">
        <h2 className="font-bold text-slate-900">Questions du quiz ({linked.length})</h2>
        {linked.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune question liée pour le moment. Ajoutez-en une ci-dessous.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {linked.map((l, i) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-slate-700">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                    {i + 1}
                  </span>
                  {l.questions?.question_text}
                </span>
                <div className="flex gap-1">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => moveLinked(i, -1)}
                    disabled={i === 0}
                    aria-label="Monter"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => moveLinked(i, 1)}
                    disabled={i === linked.length - 1}
                    aria-label="Descendre"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => unlink(l.id)}
                    aria-label="Retirer la question"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <QuestionForm
        formationId={activity.formation_id}
        moduleId={activity.module_id}
        activityId={activity.id}
        nextPosition={linked.reduce((m, l) => Math.max(m, l.position ?? 0), 0) + 1}
        onDone={() => router.refresh()}
      />

      <section className="card space-y-3">
        <h2 className="font-bold text-slate-900">Ajouter depuis la banque</h2>
        {available.length === 0 ? (
          <p className="text-sm text-slate-500">Toutes les questions disponibles sont déjà liées.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {available.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-slate-700">{q.question_text}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => link(q.id)}
                  disabled={linking === q.id}
                >
                  {linking === q.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Ajouter
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}