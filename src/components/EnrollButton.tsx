"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MODE_DESC, MODE_LABEL } from "@/lib/utils";

export default function EnrollButton({ formationId, free }: { formationId: string; free: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState("classic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
    setLoading(true); setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("enroll_in_formation", { p_formation: formationId, p_mode: mode });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(free ? "/dashboard" : `/paiement/${data}`);
    router.refresh();
  }
  return (
    <div className="space-y-3">
      <div>
        <div className="label">Mode d&apos;apprentissage (modifiable ensuite)</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["classic", "interactive", "intensive"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`rounded-xl border p-3 text-left text-sm ${mode === m ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"}`}>
              <div className="font-semibold">{MODE_LABEL[m]}</div>
              <div className="text-xs text-slate-500">{MODE_DESC[m]}</div>
            </button>
          ))}
        </div>
      </div>
      <button className="btn btn-primary w-full sm:w-auto" disabled={loading} onClick={enroll}>{loading ? "…" : free ? "S'inscrire gratuitement" : "S'inscrire"}</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
