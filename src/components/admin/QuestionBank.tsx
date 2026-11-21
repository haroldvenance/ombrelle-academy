"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuestionForm from "./QuestionForm";
import { Trash2 } from "lucide-react";

export default function QuestionBank({ questions, formations }: { questions: any[]; formations: any[] }) {
  const router = useRouter();
  const [fid, setFid] = useState(formations[0]?.id ?? "");

  async function del(id: string) {
    if (!confirm("Supprimer cette question ?")) return;
    const { error } = await createClient().from("questions").delete().eq("id", id);
    if (error) alert(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-900">Banque de questions</h1>
      <select className="input max-w-sm" value={fid} onChange={(e) => setFid(e.target.value)}>
        {formations.map((f) => (
          <option key={f.id} value={f.id}>{f.title}</option>
        ))}
      </select>

      {fid && <QuestionForm formationId={fid} onDone={() => router.refresh()} />}

      <div className="card !p-0">
        <ul className="divide-y divide-slate-100 text-sm">
          {questions
            .filter((q) => q.formation_id === fid)
            .map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-slate-700">
                  {q.question_text} <span className="chip">{q.difficulty}</span>
                </span>
                <button className="btn btn-danger btn-sm" onClick={() => del(q.id)} title="Supprimer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}