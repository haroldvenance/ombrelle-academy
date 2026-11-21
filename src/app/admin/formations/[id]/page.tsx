import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormationEditor from "@/components/admin/FormationEditor";
import { requireStaff } from "@/lib/auth";

export default async function EditFormation({ params }: { params: { id: string } }) {
  const { profile } = await requireStaff();
  const supabase = createClient();
  
  const { data: f } = await supabase.from("formations").select("*").eq("id", params.id).maybeSingle();
  
  if (!f) notFound();
  
  // Restriction : un instructeur ne peut éditer que ses propres formations
  if (profile.role === "instructor" && f.created_by !== profile.id) {
    redirect("/admin/formations");
  }

  const [{ data: modules }, { data: acts }] = await Promise.all([
    supabase.from("formation_modules").select("*").eq("formation_id", f.id).order("position"),
    supabase.from("activities").select("id, module_id, lesson_id, title, status").eq("formation_id", f.id).order("position"),
  ]);

  const moduleIds = modules?.map((m: any) => m.id) ?? [];
  let lessons: any[] = [];
  
  if (moduleIds.length > 0) {
    const { data: l } = await supabase
      .from("lessons")
      .select("id, module_id, title, position, status")
      .in("module_id", moduleIds)
      .order("position");
    lessons = l ?? [];
  }

  return (
    <FormationEditor 
      formation={f} 
      modules={modules ?? []} 
      lessons={lessons} 
      activities={acts ?? []} 
    />
  );
}