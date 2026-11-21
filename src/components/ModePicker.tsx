"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MODE_LABEL } from "@/lib/utils";

type Mode = "classic" | "interactive" | "intensive";

export default function ModePicker({
  enrollmentId,
  current,
}: {
  enrollmentId: string;
  current: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(current as Mode);
  const [busy, setBusy] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync avec le serveur si le parent recharge
  useEffect(() => {
    setMode(current as Mode);
  }, [current]);

  async function change(m: Mode) {
    if (busy || m === mode) return;
    const prev = mode;
    setMode(m);
    setBusy(m);
    setError(null);

    const { error } = await createClient().rpc("set_learning_mode", {
      p_enrollment: enrollmentId,
      p_mode: m,
    });

    setBusy(null);
    if (error) {
      setMode(prev);
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Mode :</span>
        {(["classic", "interactive", "intensive"] as const).map((m) => {
          const active = mode === m;
          const isBusy = busy === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => change(m)}
              aria-pressed={active}
              disabled={!!busy}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                active
                  ? "bg-brand-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isBusy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
              {MODE_LABEL[m]}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}