import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import QuizPlayer from "@/components/QuizPlayer";

export default async function ActivityPage({ params }: { params: { id: string } }) {
  await requireUser();
  const supabase = createClient();
  const { data: a } = await supabase.from("activities").select("id, title, description, formations(slug)").eq("id", params.id).maybeSingle();
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-brand-900">{a.title}</h1>
      {a.description && <p className="text-slate-600">{a.description}</p>}
      <QuizPlayer activityId={a.id} backHref={`/learning/${(a as any).formations?.slug ?? ""}`} />
    </div>
  );
}
