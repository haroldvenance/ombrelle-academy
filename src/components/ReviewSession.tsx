"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, AlertCircle, Brain, Lightbulb, Zap, ArrowLeft,
  ArrowRight, Check, Circle, CircleDot, Square, Loader2, RotateCcw, Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/utils";
import ProgressBar from "./ProgressBar";

type Option = { id: string; text: string };
type Question = {
  id: string;
  text: string;
  type: "single_choice" | "multiple_choice" | "true_false";
  options: Option[];
  mastery_score: number;
  next_review_at: string;
};

type AnswerResult = {
  skipped?: boolean;
  is_correct: boolean | null;
  correct_option_ids?: string[];
  selected_option_ids?: string[];
  explanation?: string | null;
  next_review_at: string;
  mastery_score: number;
  xp_awarded: number;
};

type Phase = "loading" | "intro" | "playing" | "done";

export default function ReviewSession() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, xp: 0 });

  const load = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setIdx(0);
    setSelected([]);
    setResult(null);
    setStats({ correct: 0, wrong: 0, xp: 0 });

    const { data, error } = await createClient().rpc("get_review_session", {
      p_limit: 20,
    });
    if (error) {
      setError(error.message);
      setPhase("intro");
      return;
    }
    const payload = data as { total_due: number; questions: Question[] };
    setTotalDue(payload.total_due ?? 0);
    setQuestions(payload.questions ?? []);
    setPhase((payload.questions ?? []).length > 0 ? "intro" : "done");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = questions[idx];

  const toggle = useCallback(
    (optId: string) => {
      if (result || !q) return;
      if (q.type === "multiple_choice") {
        setSelected((p) =>
          p.includes(optId) ? p.filter((x) => x !== optId) : [...p, optId]
        );
      } else {
        setSelected([optId]);
      }
    },
    [q, result]
  );

  const submitWith = useCallback(
    async (selection: string[]) => {
      if (submitting || !q) return;
      setSubmitting(true);
      setError(null);

      const { data, error } = await createClient().rpc("submit_review_answer", {
        p_question: q.id,
        p_selected: selection,
      });
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      const r = data as AnswerResult;
      setResult(r);
      if (!r.skipped) {
        setStats((s) => ({
          correct: s.correct + (r.is_correct ? 1 : 0),
          wrong: s.wrong + (r.is_correct ? 0 : 1),
          xp: s.xp + (r.xp_awarded ?? 0),
        }));
      }
      router.refresh();
    },
    [q, submitting, router]
  );

  const next = useCallback(() => {
    setSelected([]);
    setResult(null);
    if (idx + 1 >= questions.length) setPhase("done");
    else setIdx(idx + 1);
  }, [idx, questions.length]);

  // Raccourcis clavier en mode playing
  useEffect(() => {
    if (phase !== "playing") return;
    function onKey(e: KeyboardEvent) {
      if (!q) return;
      if (result) {
        if (e.key === "Enter") {
          e.preventDefault();
          next();
        }
        return;
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) {
        e.preventDefault();
        toggle(q.options[n - 1].id);
      }
      if (e.key === "Enter" && selected.length > 0) {
        e.preventDefault();
        submitWith(selected);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, q, result, selected, toggle, submitWith, next]);

  // ── LOADING ─────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="card flex items-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement de la session…
      </div>
    );
  }

  // ── ERROR (aucune question chargée) ─────────────────────────
  if (error && questions.length === 0) {
    return (
      <div className="card text-red-700">
        <p role="alert" className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
        <button type="button" className="btn btn-secondary mt-3" onClick={load}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Réessayer
        </button>
      </div>
    );
  }

  // ── DONE ────────────────────────────────────────────────────
  if (phase === "done") {
    const total = stats.correct + stats.wrong;
    const isFreshEmpty = total === 0;

    if (isFreshEmpty) {
      return (
        <div className="card py-12 text-center">
          <CheckCircle2
            className="mx-auto h-12 w-12 text-emerald-500"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            Aucune révision en attente
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Toutes vos questions sont à jour. Continuez vos activités pour enrichir votre
            paquet.
          </p>
          <Link href="/dashboard" className="btn btn-primary mt-4">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour au tableau de bord
          </Link>
        </div>
      );
    }

    const pct = Math.round((stats.correct / total) * 100);
    return (
      <div className="card space-y-5 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            pct >= 70 ? "bg-emerald-50" : "bg-amber-50"
          }`}
        >
          {pct >= 70 ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-7 w-7 text-amber-500" aria-hidden="true" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Session terminée</h2>
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Correctes</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.correct}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Incorrectes</p>
            <p className="text-2xl font-bold text-red-600">{stats.wrong}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">XP gagnés</p>
            <p className="text-2xl font-bold text-accent-700">{stats.xp}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-secondary" onClick={load}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Nouvelle session
          </button>
          <Link href="/dashboard" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  // ── INTRO ───────────────────────────────────────────────────
  if (phase === "intro") {
    const extra = totalDue - questions.length;
    return (
      <div className="card space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <Brain className="h-7 w-7 text-brand-700" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Session de révision</h2>
          <p className="mt-1 text-sm text-slate-600">
            {questions.length} question{questions.length > 1 ? "s" : ""} dans cette session
            {extra > 0 && (
              <span className="text-slate-500">
                {" "}· {extra} autre{extra > 1 ? "s" : ""} dans les prochaines
              </span>
            )}
          </p>
        </div>
        <p className="mx-auto max-w-md text-sm text-slate-500">
          Chaque bonne réponse repousse la prochaine révision. Une erreur remet la question
          à demain — c&apos;est le principe même de la répétition espacée.
        </p>
        <button
          type="button"
          className="btn btn-primary mx-auto"
          onClick={() => setPhase("playing")}
        >
          Commencer la session <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────
  if (!q) {
    return (
      <div className="card">
        Aucune question à réviser pour le moment.{" "}
        <button type="button" className="underline" onClick={load}>
          Recharger
        </button>
      </div>
    );
  }

  const isMulti = q.type === "multiple_choice";
  const last = idx + 1 === questions.length;
  const showFeedback = !!result && !result.skipped;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>
            Question {idx + 1}/{questions.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <Brain className="h-3 w-3" aria-hidden="true" /> Maîtrise {q.mastery_score}/4
          </span>
        </div>
        <ProgressBar
          value={((idx + (result ? 1 : 0)) / questions.length) * 100}
          label={`Progression de la session : question ${idx + 1} sur ${questions.length}`}
        />
      </div>

      <div className="card space-y-4">
        <p className="text-lg font-semibold text-slate-900">{q.text}</p>
        {isMulti && <p className="text-xs text-slate-500">Plusieurs réponses possibles.</p>}

        <div className="space-y-2">
          {q.options.map((o, i) => {
            const isSel = selected.includes(o.id);
            const isCorrect = showFeedback
              ? (result?.correct_option_ids ?? []).includes(o.id)
              : false;

            let cls = "border-slate-200 hover:bg-slate-50";
            if (showFeedback) {
              if (isCorrect) cls = "border-emerald-300 bg-emerald-50";
              else if (isSel) cls = "border-red-300 bg-red-50";
              else cls = "border-slate-200 opacity-60";
            } else if (isSel) {
              cls = "border-brand-600 bg-brand-50 font-semibold";
            }

            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                disabled={!!result}
                aria-pressed={isSel}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${cls}`}
              >
                {showFeedback ? (
                  isCorrect ? (
                    <CheckCircle2
                      className="h-4 w-4 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : isSel ? (
                    <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                  ) : isMulti ? (
                    <Square className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  )
                ) : isMulti ? (
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

        {result && result.skipped && (
          <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
            <p className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" aria-hidden="true" /> Déjà révisée
            </p>
            <p className="mt-1 text-xs">
              Cette question a été révisée dans une autre session. Elle sera reprogrammée
              normalement.
            </p>
          </div>
        )}

        {showFeedback && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl p-4 text-sm ${
              result!.is_correct
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <p className="flex items-center gap-2 font-semibold">
              {result!.is_correct ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Bonne réponse
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" aria-hidden="true" /> Réponse incorrecte
                </>
              )}
            </p>
            {result!.explanation && (
              <p className="mt-2 flex gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {result!.explanation}
              </p>
            )}
            <p className="mt-2 text-xs opacity-80">
              Prochaine révision : {formatRelative(result!.next_review_at)}
              {(result!.xp_awarded ?? 0) > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 font-semibold">
                  <Zap className="h-3 w-3" aria-hidden="true" /> +{result!.xp_awarded} XP
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
      )}

      <div className="flex justify-between gap-2">
        {!result ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => submitWith([])}
              disabled={submitting}
              title="Révéler la réponse et considérer comme incorrecte"
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> Voir la réponse
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={selected.length === 0 || submitting}
              onClick={() => submitWith(selected)}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Validation…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Valider
                </>
              )}
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary ml-auto" onClick={next}>
            {last ? "Terminer la session" : "Question suivante"}{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}