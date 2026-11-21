"use client";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error } = await createClient().auth.signOut();
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }

    // Rechargement complet pour garantir que le middleware relit l'absence
    // de cookie de session et n'affiche pas une page protégée en cache RSC.
    window.location.href = "/";
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-brand-800 disabled:opacity-50"
        onClick={signOut}
        disabled={busy}
        aria-busy={busy}
        aria-label="Se déconnecter"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogOut className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Déconnexion</span>
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}