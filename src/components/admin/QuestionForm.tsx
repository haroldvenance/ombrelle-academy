"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Opt = { text: string; correct: boolean; feedback: string };

export default function QuestionForm({ formationId, moduleId, activityId, nextPosition = 1, onDone }: { formationId: string; moduleId?: string | null; activityId?: string; nextPosition?: number; onDone: () => void }) {
  const supabase = createClient();
  const [text, setText] = useState(""); const [type, setType] = useState("single_choice"); const [difficulty, setDifficulty] = useState("medium");
  const [points, setPoints] = useState("10"); const [explanation, setExplanation] = useState(""); const [tags, setTags] = useState("");
  const [opts, setOpts] = useState<Opt[]>([{ text: "", correct: true, feedback: "" }, { text: "", correct: false, feedback: "" }]);
  const [error, setError] = useState<string | null>(null);

  function changeType(t: string) {
    setType(t);
    if (t === "true_false") setOpts([{ text: "Vrai", correct: true, feedback: "" }, { text: "Faux", correct: false, feedback: "" }]);
  }
  function setCorrect(i: number) { setOpts(opts.map((o, j) => ({ ...o, correct: type === "multiple_choice" ? (j === i ? !o.correct : o.correct) : j === i }))); }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const filled = opts.filter((o) => o.text.trim());
    if (filled.length < 2 || !filled.some((o) => o.correct)) { setError("Au moins 2 réponses dont 1 correcte."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: q, error } = await supabase.from("questions").insert({
      formation_id: formationId, module_id: moduleId ?? null, question_text: text, question_type: type, difficulty, points: Number(points),
      explanation, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), created_by: user?.id,
    }).select("id").single();
    if (error) { setError(error.message); return; }
    const r = await supabase.from("question_options").insert(filled.map((o, i) => ({ question_id: q.id, option_text: o.text, is_correct: o.correct, feedback: o.feedback || null, position: i + 1 })));
    if (r.error) { setError(r.error.message); return; }
    if (activityId) await supabase.from("activity_questions").insert({ activity_id: activityId, question_id: q.id, position: nextPosition });
    setText(""); setExplanation(""); setTags(""); setOpts([{ text: "", correct: true, feedback: "" }, { text: "", correct: false, feedback: "" }]); onDone();
  }
  return (
    <form onSubmit={save} className="card space-y-3 !p-4">
      <h3 className="font-bold">Nouvelle question</h3>
      <textarea className="input" rows={2} required placeholder="Énoncé" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <select className="input" value={type} onChange={(e) => changeType(e.target.value)}><option value="single_choice">Choix unique</option><option value="multiple_choice">Choix multiples</option><option value="true_false">Vrai / Faux</option></select>
        <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Difficile</option></select>
        <input className="input" type="number" min="0" value={points} onChange={(e) => setPoints(e.target.value)} title="Points" />
      </div>
      <div className="space-y-2">
        {opts.map((o, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input type={type === "multiple_choice" ? "checkbox" : "radio"} checked={o.correct} onChange={() => setCorrect(i)} title="Bonne réponse" />
            <input className="input !w-auto flex-1" placeholder={`Réponse ${i + 1}`} value={o.text} disabled={type === "true_false"} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            <input className="input !w-auto flex-1" placeholder="Feedback si choisie (optionnel)" value={o.feedback} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, feedback: e.target.value } : x)))} />
          </div>))}
        {type !== "true_false" && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpts([...opts, { text: "", correct: false, feedback: "" }])}>+ Réponse</button>}
      </div>
      <textarea className="input" rows={2} placeholder="Explication (affichée après correction)" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      <input className="input" placeholder="Tags (séparés par des virgules)" value={tags} onChange={(e) => setTags(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary">Ajouter la question</button>
    </form>
  );
}
