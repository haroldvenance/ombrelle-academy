"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, AlertCircle, Lightbulb, RotateCcw,
  ArrowLeft, ArrowRight, Check, Square, Circle, CircleDot, Zap, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProgressBar from "./ProgressBar";

type Opt = { id: string; text: string };
type Q = { id: string; text: string; type: string; options: Opt[]; media_url?: string };

export default function QuizPlayer({ activityId, backHref }: { activityId: string; backHref: string }) {
  const router = useRouter();
  const [act, setAct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setAct(null);
    setResult(null);
    setAnswers({});
    setIdx(0);
    setError(null);
    const { data, error } = await createClient().rpc("get_activity_for_play", { p_activity: activityId });
    if (error) setError(error.message);
    else setAct(data);
  }, [activityId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="card text-red-700">
        <p className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
        <div className="mt-3">
          <Link className="btn btn-secondary" href={backHref}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
      </div>
    );
  }

  if (!act) {
    return (
      <div className="card flex items-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
      </div>
    );
  }

  const questions: Q[] = act.questions ?? [];
  if (questions.length === 0) {
    return <div className="card">Cette activité ne contient pas encore de questions.</div>;
  }

  function toggle(q: Q, optId: string) {
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      if (q.type === "multiple_choice") {
        return { ...prev, [q.id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId] };
      }
      return { ...prev, [q.id]: [optId] };
    });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const { data, error } = await createClient().rpc("submit_activity", { p_activity: activityId, p_answers: answers });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResult(data);
    router.refresh();
  }

  // ── Vue résultats ─────────────────────────────────────────────
  if (result) {
    const byQ: Record<string, any> = Object.fromEntries((result.results ?? []).map((r: any) => [r.question_id, r]));
    return (
      <div className="space-y-4">
        <div className={`card text-center ${result.passed ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white">
            {result.passed ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-amber-500" />
            )}
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {result.passed ? "Activité réussie" : "Objectif non atteint"}
          </h2>
          <p className="mt-1 text-slate-700">
            Score : <strong>{result.score}/{result.max_score}</strong> ({result.percentage} %) — seuil {result.passing_score} %
          </p>
          {result.xp_awarded > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 font-semibold text-accent-700">
              <Zap className="h-4 w-4" /> +{result.xp_awarded} XP
            </p>
          )}
        </div>

        {questions.map((q) => {
          const r = byQ[q.id];
          if (!r) return null;
          return (
            <div key={q.id} className="card">
              <div className="mb-2 flex items-start gap-2">
                {r.is_correct ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                )}
                <p className="font-semibold text-slate-900">{q.text}</p>
              </div>
              <ul className="space-y-1 text-sm">
                {q.options.map((o) => {
                  const correct = r.correct_option_ids.includes(o.id);
                  const sel = r.selected_option_ids.includes(o.id);
                  return (
                    <li
                      key={o.id}
                      className={`rounded-lg px-3 py-2 ${
                        correct
                          ? "bg-emerald-100 text-emerald-900"
                          : sel
                          ? "bg-red-100 text-red-900"
                          : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {o.text}
                      {sel && <span className="ml-2 text-xs italic">(votre réponse)</span>}
                      {!r.is_correct && sel && r.option_feedback?.[o.id] && (
                        <span className="ml-2 text-xs">— {r.option_feedback[o.id]}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {r.explanation && (
                <p className="mt-2 flex gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
                  <Lightbulb className="h-4 w-4 shrink-0 text-brand-600" />
                  {r.explanation}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2">
          {result.attempts_left !== 0 && (
            <button className="btn btn-accent" onClick={load}>
              <RotateCcw className="h-4 w-4" /> Réessayer
            </button>
          )}
          <Link className="btn btn-primary" href={backHref}>
            <ArrowLeft className="h-4 w-4" /> Retour au cours
          </Link>
        </div>
      </div>
    );
  }

  // ── Vue question ──────────────────────────────────────────────
  const q = questions[idx];
  const sel = answers[q.id] ?? [];
  const last = idx === questions.length - 1;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Question {idx + 1}/{questions.length}</span>
          <span className="inline-flex items-center gap-1">
            <Zap className="h-3 w-3" /> {act.xp_reward} XP à gagner
          </span>
        </div>
        <ProgressBar value={((idx + 1) / questions.length) * 100} />
      </div>

      <div className="card space-y-4">
        <p className="text-lg font-semibold text-slate-900">{q.text}</p>
        {q.type === "multiple_choice" && (
          <p className="text-xs text-slate-500">Plusieurs réponses possibles.</p>
        )}
        <div className="space-y-2">
          {q.options.map((o) => {
            const isSel = sel.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggle(q, o.id)}
                aria-pressed={isSel}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                  isSel
                    ? "border-brand-600 bg-brand-50 font-semibold text-brand-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {q.type === "multiple_choice" ? (
                  isSel ? <Check className="h-4 w-4 text-brand-700" /> : <Square className="h-4 w-4 text-slate-400" />
                ) : isSel ? (
                  <CircleDot className="h-4 w-4 text-brand-700" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400" />
                )}
                <span>{o.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <div className="flex justify-between">
        <button className="btn btn-secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          <ArrowLeft className="h-4 w-4" /> Précédent
        </button>
        {last ? (
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Correction…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Valider mes réponses</>
            )}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>
            Suivant <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}