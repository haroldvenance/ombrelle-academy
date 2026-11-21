"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function PaymentReview({
  id,
  amount,
  currency,
  studentName,
  formationTitle,
}: {
  id: string;
  amount?: number;
  currency?: string;
  studentName?: string;
  formationTitle?: string;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function review(approve: boolean) {
    const label = approve ? "valider" : "refuser";
    const summary =
      amount !== undefined && studentName && formationTitle
        ? `Confirmer ${approve ? "la validation" : "le refus"} du paiement de ${studentName} pour « ${formationTitle} » (${amount.toLocaleString("fr-FR")} ${currency ?? "FCFA"}) ?`
        : `Confirmer ${label === "valider" ? "la validation" : "le refus"} de ce paiement ?`;

    if (!confirm(summary)) return;

    setBusy(approve ? "approve" : "reject");
    setMsg(null);

    const { error } = await createClient().rpc("review_payment", {
      p_payment: id,
      p_approve: approve,
      p_comment: comment.trim() || null,
    });

    setBusy(null);
    if (error) {
      setMsg(error.message);
      return;
    }
    setComment("");
    router.refresh();
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input w-auto flex-1 min-w-[160px]"
          placeholder="Commentaire (optionnel)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!!busy}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => review(true)}
          disabled={!!busy}
        >
          {busy === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Valider
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => review(false)}
          disabled={!!busy}
        >
          {busy === "reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Refuser
        </button>
      </div>
      {msg && (
        <p role="alert" className="text-xs text-red-600">
          {msg}
        </p>
      )}
    </div>
  );
}