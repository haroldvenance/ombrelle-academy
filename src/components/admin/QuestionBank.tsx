"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuestionForm from "./QuestionForm";
import { Pencil, Trash2, Search, Loader2 } from "lucide-react";

export default function QuestionBank({
  questions,
  formations,
  selectedFid,
}: {
  questions: any[];
  formations: any[];
  selectedFid: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fid = selectedFid ?? formations[0]?.id ?? "";

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return questions.filter((q) => !s || q.question_text.toLowerCase().includes(s));
  }, [questions, search]);

  function changeFormation(newFid: string) {
    router.push(`/admin/questions?fid=${newFid}`);
  }

  async function startEdit(q: any) {
    setLoadingEdit(q.id);
    setError(null);

    const { data: opts, error } = await supabase
      .from("question_options")
      .select("option_text, is_correct, feedback, position")
      .eq("question_id", q.id)
      .order("position");

    setLoadingEdit(null);
    if (error) {
      setError(error.message);
      return;
    }

    setEditing({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      difficulty: q.difficulty,
      points: q.points ?? 10,
      explanation: q.explanation ?? "",
      tags: (q.tags ?? []).join(", "),
      options: opts ?? [],
    });
  }

  async function del(id: string) {
    setDeleting(id);
    setError(null);

    // Vérifie que la question n'est pas utilisée dans une activité
    const { count, error: cErr } = await supabase
      .from("activity_questions")
      .select("id", { count: "exact", head: true })
      .eq("question_id", id);

    if (cErr) {
      setDeleting(null);
      setError(cErr.message);
      return;
    }

    if ((count ?? 0) > 0) {
      setDeleting(null);
      setError(
        `Cette question est utilisée dans ${count} activité(s). Retirez-la d'abord de ces activités.`
      );
      return;
    }

    if (!confirm("Supprimer définitivement cette question ?")) {
      setDeleting(null);
      return;
    }

    const { error } = await supabase.from("questions").delete().eq("id", id);
    setDeleting(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  if (formations.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm text-amber-800">
          Créez d'abord une formation pour pouvoir ajouter des questions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="input max-w-sm"
          value={fid}
          onChange={(e) => changeFormation(e.target.value)}
          aria-label="Formation"
        >
          {formations.map((f) => (
            <option key={f.id} value={f.id}>{f.title}</option>
          ))}
        </select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Rechercher une question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="text-sm text-slate-500 self-center">
          {filtered.length} question(s)
        </span>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {editing && (
        <QuestionForm
          formationId={fid}
          initial={editing}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {fid && !editing && (
        <QuestionForm formationId={fid} onDone={() => router.refresh()} />
      )}

      <div className="card p-0">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-500">
            <p className="font-medium text-slate-700">
              {search ? "Aucun résultat" : "Aucune question"}
            </p>
            <p className="mt-1 text-sm">
              {search
                ? `Aucune question ne correspond à « ${search} ».`
                : "Ajoutez votre première question ci-dessus."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {filtered.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-slate-700 flex-1">
                  {q.question_text}{" "}
                  <span className="chip">{q.difficulty}</span>
                  {q.question_type && (
                    <span className="ml-1 text-xs text-slate-500">{q.question_type}</span>
                  )}
                </span>
                <div className="flex gap-1">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => startEdit(q)}
                    disabled={loadingEdit === q.id}
                    aria-label="Éditer"
                  >
                    {loadingEdit === q.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Pencil className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => del(q.id)}
                    disabled={deleting === q.id}
                    aria-label="Supprimer"
                  >
                    {deleting === q.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}