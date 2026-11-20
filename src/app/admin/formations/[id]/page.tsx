import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormationEditor from "@/components/admin/FormationEditor";

export default async function EditFormation({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: f } = await supabase.from("formations").select("*").eq("id", params.id).maybeSingle();
  if (!f) notFound();
  const [{ data: modules }, { data: lessons }, { data: acts }] = await Promise.all([
    supabase.from("formation_modules").select("*").eq("formation_id", f.id).order("position"),
    supabase.from("lessons").select("id, module_id, title, position, status").in("module_id", (await supabase.from("formation_modules").select("id").eq("formation_id", f.id)).data?.map((m: any) => m.id) ?? []).order("position"),
    supabase.from("activities").select("id, module_id, lesson_id, title, status").eq("formation_id", f.id).order("position"),
  ]);
  return <FormationEditor formation={f} modules={modules ?? []} lessons={lessons ?? []} activities={acts ?? []} />;
}
