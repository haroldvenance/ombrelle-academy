import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivityEditor from "@/components/admin/ActivityEditor";

export default async function EditActivity({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: a } = await supabase.from("activities").select("*").eq("id", params.id).maybeSingle();
  
  if (!a) notFound();

  const [{ data: linked }, { data: bank }] = await Promise.all([
    supabase
      .from("activity_questions")
      .select("id, position, questions(id, question_text, question_type)")
      .eq("activity_id", a.id)
      .order("position"),
    supabase
      .from("questions")
      .select("id, question_text, question_type")
      .eq("formation_id", a.formation_id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ActivityEditor 
      activity={a} 
      linked={linked ?? []} 
      bank={bank ?? []} 
    />
  );
}