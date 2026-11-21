"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, MODE_DESC, MODE_LABEL } from "@/lib/utils";

export default function EnrollButton({
  formationId,
  free,
  title,
  price,
}: {
  formationId: string;
  free: boolean;
  title?: string;
  price?: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"classic" | "interactive" | "intensive">("classic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
    if (loading) return;

    if (!free) {
      const summary =
        title && price !== undefined
          ? `S'inscrire à « ${title} » pour ${formatPrice(price)} ? Vous serez redirigé vers le paiement.`
          : "Cette formation est payante. Vous serez redirigé vers le paiement. Continuer ?";
      if (!confirm(summary)) return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await createClient().rpc("enroll_in_formation", {
      p_formation: formationId,
      p_mode: mode,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (!data || typeof data !== "string") {
      setError("Impossible de créer l'inscription. Réessayez.");
      setLoading(false);
      return;
    }

    router.push(free ? "/dashboard" : `/paiement/${data}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="label">Mode d&apos;apprentissage (modifiable ensuite)</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["classic", "interactive", "intensive"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={active}
                disabled={loading}
                className={`rounded-xl border p-3 text-left text-sm transition-colors disabled:opacity-60 ${
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
      </fieldset>

      <button
        type="button"
        className="btn btn-primary w-full sm:w-auto"
        disabled={loading}
        onClick={enroll}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Inscription…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />{" "}
            {free ? "S'inscrire gratuitement" : "S'inscrire"}
          </>
        )}
      </button>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}