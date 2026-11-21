"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Save, X, Loader2 } from "lucide-react";

type Opt = { text: string; correct: boolean; feedback: string };

type InitialQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  points: number | string;
  explanation?: string;
  tags?: string;
  options: {
    option_text: string;
    is_correct: boolean;
    feedback?: string | null;
    position?: number;
  }[];
};

export default function QuestionForm({
  formationId,
  moduleId,
  activityId,
  nextPosition = 1,
  initial,
  onDone,
  onCancel,
}: {
  formationId: string;
  moduleId?: string | null;
  activityId?: string;
  nextPosition?: number;
  initial?: InitialQuestion;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const supabase = createClient();
  const isEdit = !!initial;

  const [text, setText] = useState(initial?.question_text ?? "");
  const [type, setType] = useState(initial?.question_type ?? "single_choice");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "medium");
  const [points, setPoints] = useState(String(initial?.points ?? "10"));
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [opts, setOpts] = useState<Opt[]>(
    initial?.options?.length
      ? initial.options.map((o) => ({
          text: o.option_text,
          correct: o.is_correct,
          feedback: o.feedback ?? "",
        }))
      : [
          { text: "", correct: true, feedback: "" },
          { text: "", correct: false, feedback: "" },
        ]
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Réinitialise si on passe d'une édition à une autre
  useEffect(() => {
    if (!initial) return;
    setText(initial.question_text);
    setType(initial.question_type);
    setDifficulty(initial.difficulty);
    setPoints(String(initial.points ?? "10"));
    setExplanation(initial.explanation ?? "");
    setTags(initial.tags ?? "");
    setOpts(
      initial.options?.length
        ? initial.options.map((o) => ({
            text: o.option_text,
            correct: o.is_correct,
            feedback: o.feedback ?? "",
          }))
        : [
            { text: "", correct: true, feedback: "" },
            { text: "", correct: false, feedback: "" },
          ]
    );
  }, [initial]);

  function changeType(t: string) {
    setType(t);
    if (t === "true_false") {
      setOpts([
        { text: "Vrai", correct: true, feedback: "" },
        { text: "Faux", correct: false, feedback: "" },
      ]);
    }
  }

  function setCorrect(i: number) {
    setOpts(
      opts.map((o, j) => ({
        ...o,
        correct: type === "multiple_choice" ? (j === i ? !o.correct : o.correct) : j === i,
      }))
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!text.trim()) {
      setError("L'énoncé est requis.");
      return;
    }

    const filled = opts
      .map((o, i) => ({ ...o, _origIndex: i }))
      .filter((o) => o.text.trim());

    if (filled.length < 2 || !filled.some((o) => o.correct)) {
      setError("Au moins 2 réponses dont une correcte sont nécessaires.");
      return;
    }

    const numericPoints = Math.max(0, Number(points) || 0);

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("Session expirée. Reconnectez-vous.");
      return;
    }

    const payload = {
      formation_id: formationId,
      module_id: moduleId ?? null,
      question_text: text.trim(),
      question_type: type,
      difficulty,
      points: numericPoints,
      explanation,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      created_by: user.id,
    };

    let questionId: string | null = null;

    if (isEdit) {
      // UPDATE question
      const { error: qErr } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", initial!.id);
      if (qErr) {
        setBusy(false);
        setError(qErr.message);
        return;
      }

      // DELETE + reinsert options (transaction non dispo côté client, mais on remplace intégralement)
      const { error: dErr } = await supabase
        .from("question_options")
        .delete()
        .eq("question_id", initial!.id);
      if (dErr) {
        setBusy(false);
        setError(dErr.message);
        return;
      }

      const { error: iErr } = await supabase.from("question_options").insert(
        filled.map((o, i) => ({
          question_id: initial!.id,
          option_text: o.text.trim(),
          is_correct: o.correct,
          feedback: o.feedback.trim() || null,
          position: i + 1,
        }))
      );
      if (iErr) {
        setBusy(false);
        setError(iErr.message);
        return;
      }

      questionId = initial!.id;
    } else {
      // INSERT question
      const { data: q, error: qErr } = await supabase
        .from("questions")
        .insert(payload)
        .select("id")
        .single();
      if (qErr) {
        setBusy(false);
        setError(qErr.message);
        return;
      }
      questionId = q.id;

      const { error: oErr } = await supabase.from("question_options").insert(
        filled.map((o, i) => ({
          question_id: q.id,
          option_text: o.text.trim(),
          is_correct: o.correct,
          feedback: o.feedback.trim() || null,
          position: i + 1,
        }))
      );
      if (oErr) {
        // Compensation : on supprime la question orpheline
        await supabase.from("questions").delete().eq("id", q.id);
        setBusy(false);
        setError(oErr.message);
        return;
      }

      if (activityId) {
        const { error: aqErr } = await supabase.from("activity_questions").insert({
          activity_id: activityId,
          question_id: q.id,
          position: nextPosition,
        });
        if (aqErr) {
          setBusy(false);
          setError(aqErr.message);
          return;
        }
      }
    }

    setBusy(false);

    if (!isEdit) {
      setText("");
      setExplanation("");
      setTags("");
      setOpts([
        { text: "", correct: true, feedback: "" },
        { text: "", correct: false, feedback: "" },
      ]);
    }

    onDone();
  }

  return (
    <form onSubmit={save} className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">
          {isEdit ? "Éditer la question" : "Nouvelle question"}
        </h3>
        {isEdit && onCancel && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={busy}
          >
            <X className="h-3.5 w-3.5" /> Annuler
          </button>
        )}
      </div>

      <textarea
        className="input"
        rows={2}
        required
        placeholder="Énoncé"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select className="input" value={type} onChange={(e) => changeType(e.target.value)} disabled={busy}>
          <option value="single_choice">Choix unique</option>
          <option value="multiple_choice">Choix multiples</option>
          <option value="true_false">Vrai / Faux</option>
        </select>
        <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={busy}>
          <option value="easy">Facile</option>
          <option value="medium">Moyen</option>
          <option value="hard">Difficile</option>
        </select>
        <input
          className="input"
          type="number"
          min="0"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          placeholder="Points"
          title="Points"
          disabled={busy}
        />
      </div>

      <div className="space-y-2">
        {opts.map((o, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              type={type === "multiple_choice" ? "checkbox" : "radio"}
              checked={o.correct}
              onChange={() => setCorrect(i)}
              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
              aria-label="Bonne réponse"
              disabled={busy}
            />
            <input
              className="input w-auto flex-1 min-w-[140px]"
              placeholder={`Réponse ${i + 1}`}
              value={o.text}
              disabled={type === "true_false" || busy}
              onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            />
            <input
              className="input w-auto flex-1 min-w-[140px]"
              placeholder="Feedback si choisie (optionnel)"
              value={o.feedback}
              onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, feedback: e.target.value } : x)))}
              disabled={busy}
            />
            {type !== "true_false" && opts.length > 2 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setOpts(opts.filter((_, j) => j !== i))}
                aria-label="Retirer cette réponse"
                disabled={busy}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {type !== "true_false" && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setOpts([...opts, { text: "", correct: false, feedback: "" }])}
            disabled={busy}
          >
            <Plus className="h-3.5 w-3.5" /> Réponse
          </button>
        )}
      </div>

      <textarea
        className="input"
        rows={2}
        placeholder="Explication (affichée après correction)"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        disabled={busy}
      />
      <input
        className="input"
        placeholder="Tags (séparés par des virgules)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        disabled={busy}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}

      <button className="btn btn-primary" disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isEdit ? "Enregistrer" : "Ajouter la question"}
      </button>
    </form>
  );
}