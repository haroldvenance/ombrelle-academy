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

export default function QuizPlayer({
  activityId,
  backHref,
}: {
  activityId: string;
  backHref: string;
}) {
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
    const { data, error } = await createClient().rpc("get_activity_for_play", {
      p_activity: activityId,
    });
    if (error) setError(error.message);
    else setAct(data);
  }, [activityId]);

  useEffect(() => {
    load();
  }, [load]);

  const questions: Q[] = act?.questions ?? [];
  const q = questions[idx];

  const toggle = useCallback((qq: Q, optId: string) => {
    setAnswers((prev) => {
      const cur = prev[qq.id] ?? [];
      if (qq.type === "multiple_choice") {
        return {
          ...prev,
          [qq.id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId],
        };
      }
      return { ...prev, [qq.id]: [optId] };
    });
  }, []);

  const submit = useCallback(async () => {
    if (busy) return;
    const unanswered = questions.filter((qq) => !(answers[qq.id]?.length)).length;
    if (unanswered > 0) {
      const msg = `${unanswered} question${unanswered > 1 ? "s" : ""} non répondue${
        unanswered > 1 ? "s" : ""
      }. Valider quand même ?`;
      if (!confirm(msg)) return;
    }
    setBusy(true);
    setError(null);
    const { data, error } = await createClient().rpc("submit_activity", {
      p_activity: activityId,
      p_answers: answers,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResult(data);
    router.refresh();
  }, [activityId, answers, busy, questions, router]);

  // Raccourcis clavier : 1-9 = réponse, Entrée = valider / suivant
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!act || error) return;
      if (result) {
        if (e.key === "Enter") {
          e.preventDefault();
          // Click le bouton "Retour au cours" ou "Réessayer" — comportement par défaut
        }
        return;
      }
      if (!q) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) {
        e.preventDefault();
        toggle(q, q.options[n - 1].id);
      }
      if (e.key === "Enter" && (answers[q.id]?.length ?? 0) > 0 && idx === questions.length - 1) {
        e.preventDefault();
        submit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, error, result, q, answers, idx, questions.length, toggle, submit]);

  if (error && !act) {
    return (
      <div className="card text-red-700">
        <p role="alert" className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
        <div className="mt-3">
          <Link className="btn btn-secondary" href={backHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
          </Link>
        </div>
      </div>
    );
  }

  if (!act) {
    return (
      <div className="card flex items-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement…
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="card">Cette activité ne contient pas encore de questions.</div>;
  }

  // ── Vue résultats ─────────────────────────────────────────────
  if (result) {
    const byQ: Record<string, any> = Object.fromEntries(
      (result.results ?? []).map((r: any) => [r.question_id, r])
    );
    const canRetry =
      result.attempts_left === null ||
      result.attempts_left === undefined ||
      result.attempts_left > 0;

    return (
      <div className="space-y-4">
        <div
          role="status"
          aria-live="polite"
          className={`card text-center ${
            result.passed
              ? "border-emerald-300 bg-emerald-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white">
            {result.passed ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-8 w-8 text-amber-500" aria-hidden="true" />
            )}
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {result.passed ? "Activité réussie" : "Objectif non atteint"}
          </h2>
          <p className="mt-1 text-slate-700">
            Score :{" "}
            <strong>
              {result.score}/{result.max_score}
            </strong>{" "}
            ({result.percentage} %) — seuil {result.passing_score} %
          </p>
          {result.xp_awarded > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 font-semibold text-accent-700">
              <Zap className="h-4 w-4" aria-hidden="true" /> +{result.xp_awarded} XP
            </p>
          )}
          {!canRetry && result.attempts_left === 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Nombre maximal de tentatives atteint.
            </p>
          )}
        </div>

        {questions.map((qq) => {
          const r = byQ[qq.id];
          if (!r) return null;
          return (
            <div key={qq.id} className="card">
              <div className="mb-2 flex items-start gap-2">
                {r.is_correct ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                )}
                <p className="font-semibold text-slate-900">{qq.text}</p>
              </div>
              <ul className="space-y-1 text-sm">
                {qq.options.map((o) => {
                  const correct = (r.correct_option_ids ?? []).includes(o.id);
                  const sel = (r.selected_option_ids ?? []).includes(o.id);
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
                  <Lightbulb
                    className="h-4 w-4 shrink-0 text-brand-600"
                    aria-hidden="true"
                  />
                  {r.explanation}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2">
          {canRetry && (
            <button type="button" className="btn btn-accent" onClick={load}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Réessayer
            </button>
          )}
          <Link className="btn btn-primary" href={backHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour au cours
          </Link>
        </div>
      </div>
    );
  }

  // ── Vue question ──────────────────────────────────────────────
  const sel = answers[q.id] ?? [];
  const last = idx === questions.length - 1;
  const unanswered = questions.filter((qq) => !(answers[qq.id]?.length)).length;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>
            Question {idx + 1}/{questions.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <Zap className="h-3 w-3" aria-hidden="true" /> {act.xp_reward} XP à gagner
          </span>
        </div>
        <ProgressBar
          value={((idx + 1) / questions.length) * 100}
          label={`Progression du quiz : question ${idx + 1} sur ${questions.length}`}
        />
      </div>

      <div className="card space-y-4">
        <p className="text-lg font-semibold text-slate-900">{q.text}</p>
        {q.type === "multiple_choice" && (
          <p className="text-xs text-slate-500">Plusieurs réponses possibles.</p>
        )}
        <div className="space-y-2">
          {q.options.map((o, i) => {
            const isSel = sel.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(q, o.id)}
                aria-pressed={isSel}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                  isSel
                    ? "border-brand-600 bg-brand-50 font-semibold text-brand-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {q.type === "multiple_choice" ? (
                  isSel ? (
                    <Check className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  )
                ) : isSel ? (
                  <CircleDot className="h-4 w-4 text-brand-700" aria-hidden="true" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400" aria-hidden="true" />
                )}
                <span className="flex-1">{o.text}</span>
                <kbd className="hidden rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 sm:inline">
                  {i + 1}
                </kbd>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
      )}

      {last && unanswered > 0 && (
        <p className="text-sm text-amber-700">
          ⚠ {unanswered} question{unanswered > 1 ? "s" : ""} non répondue
          {unanswered > 1 ? "s" : ""}.
        </p>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Précédent
        </button>
        {last ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={submit}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Correction…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Valider mes réponses
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIdx(idx + 1)}
          >
            Suivant <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}