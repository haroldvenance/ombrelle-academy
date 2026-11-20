"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LessonComplete({ lessonId, done, nextHref }: { lessonId: string; done: boolean; nextHref?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [xp, setXp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    setLoading(true); setError(null);
    const { data, error } = await createClient().rpc("complete_lesson", { p_lesson: lessonId });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setXp((data as any)?.xp_awarded ?? 0);
    router.refresh();
  }
  return (
    <div className="space-y-3">
      {!done && xp === null && <button className="btn btn-primary w-full" disabled={loading} onClick={complete}>{loading ? "…" : "✓ Marquer la leçon comme terminée"}</button>}
      {(done || xp !== null) && (
        <div className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
          ✅ Leçon terminée{xp ? ` — +${xp} XP 🎉` : ""}
          {nextHref && <a href={nextHref} className="btn btn-primary ml-3">Continuer →</a>}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
