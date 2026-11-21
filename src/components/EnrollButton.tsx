"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MODE_DESC, MODE_LABEL } from "@/lib/utils";

export default function EnrollButton({ formationId, free }: { formationId: string; free: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState("classic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("enroll_in_formation", { p_formation: formationId, p_mode: mode });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(free ? "/dashboard" : `/paiement/${data}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="label">Mode d&apos;apprentissage (modifiable ensuite)</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["classic", "interactive", "intensive"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={active}
                className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                  active
                    ? "border-brand-600 bg-brand-50 ring-1 ring-brand-200"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold text-slate-900">{MODE_LABEL[m]}</div>
                <div className="text-xs text-slate-500">{MODE_DESC[m]}</div>
              </button>
            );
          })}
        </div>
      </div>

      <button className="btn btn-primary w-full sm:w-auto" disabled={loading} onClick={enroll}>
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Inscription…</>
        ) : (
          <><Sparkles className="h-4 w-4" /> {free ? "S'inscrire gratuitement" : "S'inscrire"}</>
        )}
      </button>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}