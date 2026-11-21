import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivityEditor from "@/components/admin/ActivityEditor";
import { requireStaff } from "@/lib/auth";

export default async function EditActivity({ params }: { params: { id: string } }) {
  const { profile } = await requireStaff();
  const supabase = createClient();

  const { data: a } = await supabase
    .from("activities")
    .select("*, formations(created_by)")
    .eq("id", params.id)
    .maybeSingle();

  if (!a) notFound();

  // Restriction : un instructeur ne peut éditer que les activités de ses formations
  if (profile.role === "instructor" && a.formations?.created_by !== profile.id) {
    redirect("/admin/formations");
  }

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