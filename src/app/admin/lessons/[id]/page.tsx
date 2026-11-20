import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LessonEditor from "@/components/admin/LessonEditor";

export default async function EditLesson({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: l } = await supabase.from("lessons").select("*, formation_modules(formation_id, title)").eq("id", params.id).maybeSingle();
  if (!l) notFound();
  const { data: acts } = await supabase.from("activities").select("id, title, status").eq("lesson_id", l.id);
  return <LessonEditor lesson={l} activities={acts ?? []} />;
}
