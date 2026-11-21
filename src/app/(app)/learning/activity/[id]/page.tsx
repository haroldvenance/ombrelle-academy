import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import QuizPlayer from "@/components/QuizPlayer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ActivityPage({ params }: { params: { id: string } }) {
  await requireUser();
  const supabase = createClient();
  const { data: a } = await supabase.from("activities").select("id, title, description, formations(slug, title)").eq("id", params.id).maybeSingle();
  
  if (!a) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link 
        href={`/learning/${(a as any).formations?.slug ?? ""}`} 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour au cours
      </Link>
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{a.title}</h1>
        {a.description && <p className="text-slate-600 mt-1">{a.description}</p>}
      </div>

      <QuizPlayer activityId={a.id} backHref={`/learning/${(a as any).formations?.slug ?? ""}`} />
    </div>
  );
}