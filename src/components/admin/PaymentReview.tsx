"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PaymentReview({ id }: { id: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function review(approve: boolean) {
    setBusy(true);
    const { error } = await createClient().rpc("review_payment", {
      p_payment: id,
      p_approve: approve,
      p_comment: comment || null,
    });
    setBusy(false);
    if (error) alert(error.message);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className="input !w-auto flex-1 min-w-[160px]"
        placeholder="Commentaire (optionnel)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={busy}
      />
      <button className="btn btn-primary btn-sm" onClick={() => review(true)} disabled={busy}>
        <CheckCircle2 className="h-3.5 w-3.5" /> Valider
      </button>
      <button className="btn btn-danger btn-sm" onClick={() => review(false)} disabled={busy}>
        <XCircle className="h-3.5 w-3.5" /> Refuser
      </button>
    </div>
  );
}