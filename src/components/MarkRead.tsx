"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MarkRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="btn btn-secondary btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().rpc("mark_notifications_read");
        setBusy(false);
        router.refresh();
      }}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
      Tout marquer comme lu
    </button>
  );
}