"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PaymentReview({ id }: { id: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  async function review(approve: boolean) {
    const { error } = await createClient().rpc("review_payment", { p_payment: id, p_approve: approve, p_comment: comment || null });
    if (error) alert(error.message); router.refresh();
  }
  return (
    <div className="flex flex-wrap gap-2"><input className="input !w-auto flex-1" placeholder="Commentaire (optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-primary btn-sm" onClick={() => review(true)}>Valider</button><button className="btn btn-danger btn-sm" onClick={() => review(false)}>Refuser</button></div>
  );
}
