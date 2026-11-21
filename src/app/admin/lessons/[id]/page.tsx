import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LessonEditor from "@/components/admin/LessonEditor";
import { requireStaff } from "@/lib/auth";

export default async function EditLesson({ params }: { params: { id: string } }) {
  const { profile } = await requireStaff();
  const supabase = createClient();

  const { data: l } = await supabase
    .from("lessons")
    .select("*, formation_modules(id, formation_id, title, formations(created_by))")
    .eq("id", params.id)
    .maybeSingle();

  if (!l) notFound();

  const owner = (l as any)?.formation_modules?.formations?.created_by;
  if (profile.role === "instructor" && owner !== profile.id) {
    redirect("/admin/formations");
  }

  const { data: acts } = await supabase
    .from("activities")
    .select("id, title, status")
    .eq("lesson_id", l.id);

  return <LessonEditor lesson={l} activities={acts ?? []} />;
}