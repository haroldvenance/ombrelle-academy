"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message = "Délai dépassé. Vérifiez votre connexion."
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

type CompleteLessonResponse = {
  data: { xp_awarded?: number } | null;
  error: { message: string } | null;
};

export default function LessonComplete({
  lessonId,
  done,
  nextHref,
}: {
  lessonId: string;
  done: boolean;
  nextHref?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [xp, setXp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = (await withTimeout(
        createClient().rpc("complete_lesson", { p_lesson: lessonId }),
        15000
      )) as CompleteLessonResponse;

      if (response.error) {
        setError(response.error.message);
        return;
      }
      setXp(response.data?.xp_awarded ?? 0);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  const finished = done || xp !== null;

  return (
    <div className="space-y-3">
      {!finished && (
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={loading}
          onClick={complete}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Enregistrement…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Marquer la leçon comme terminée
            </>
          )}
        </button>
      )}

      {finished && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <span className="font-medium">Leçon terminée</span>
          {xp ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-sm font-semibold text-emerald-700">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" /> +{xp} XP
            </span>
          ) : null}
          {nextHref && (
            <Link href={nextHref} className="btn btn-primary btn-sm ml-auto">
              Continuer <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}