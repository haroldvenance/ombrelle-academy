"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MarkRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markAll() {
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error } = await createClient().rpc("mark_notifications_read");
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={busy}
        onClick={markAll}
        aria-busy={busy}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Tout marquer comme lu
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}