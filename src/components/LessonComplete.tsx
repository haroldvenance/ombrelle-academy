"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LessonComplete({
  lessonId, done, nextHref,
}: { lessonId: string; done: boolean; nextHref?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [xp, setXp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    setLoading(true);
    setError(null);
    const { data, error } = await createClient().rpc("complete_lesson", { p_lesson: lessonId });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setXp((data as any)?.xp_awarded ?? 0);
    router.refresh();
  }

  const finished = done || xp !== null;

  return (
    <div className="space-y-3">
      {!finished && (
        <button className="btn btn-primary w-full" disabled={loading} onClick={complete}>
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> Marquer la leçon comme terminée</>
          )}
        </button>
      )}

      {finished && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="font-medium">Leçon terminée</span>
          {xp ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-sm font-semibold text-emerald-700">
              <Zap className="h-3.5 w-3.5" /> +{xp} XP
            </span>
          ) : null}
          {nextHref && (
            <Link href={nextHref} className="btn btn-primary btn-sm ml-auto">
              Continuer <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}