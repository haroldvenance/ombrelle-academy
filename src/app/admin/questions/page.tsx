import { createClient } from "@/lib/supabase/server";
import QuestionBank from "@/components/admin/QuestionBank";

export default async function Questions() {
  const supabase = createClient();
  const [{ data: questions }, { data: formations }] = await Promise.all([
    supabase.from("questions").select("id, question_text, question_type, difficulty, tags, formation_id").order("created_at", { ascending: false }).limit(200),
    supabase.from("formations").select("id, title"),
  ]);
  return <QuestionBank questions={questions ?? []} formations={formations ?? []} />;
}
