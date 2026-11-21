import { createClient } from "@/lib/supabase/server";
import QuestionBank from "@/components/admin/QuestionBank";
import { Search } from "lucide-react";

export default async function Questions() {
  const supabase = createClient();
  
  const [{ data: questions }, { data: formations }] = await Promise.all([
    supabase.from("questions").select("id, question_text, question_type, difficulty, tags, formation_id").order("created_at", { ascending: false }).limit(200),
    supabase.from("formations").select("id, title"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Banque de questions</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les questions disponibles pour vos quiz et activités.</p>
        </div>
      </div>

      <QuestionBank questions={questions ?? []} formations={formations ?? []} />
    </div>
  );
}