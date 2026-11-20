"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PaymentForm({ enrollmentId, userId, defaultAmount }: { enrollmentId: string; userId: string; defaultAmount: number }) {
  const router = useRouter();
  const [f, setF] = useState({ amount: String(defaultAmount), method: "Orange Money", reference: "", paid_on: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const supabase = createClient();
    let proof: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() ?? "jpg";
      proof = `${userId}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(proof, file);
      if (up.error) { setBusy(false); setMsg({ ok: false, text: up.error.message }); return; }
    }
    const { error } = await supabase.rpc("submit_payment", {
      p_enrollment: enrollmentId, p_amount: Number(f.amount), p_method: f.method, p_reference: f.reference,
      p_paid_on: f.paid_on || null, p_proof_url: proof,
    });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: "Paiement soumis. Un administrateur va le vérifier." });
    setF({ ...f, reference: "" }); setFile(null); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Montant payé</label><input className="input" type="number" min="1" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
        <div><label className="label">Moyen de paiement</label>
          <select className="input" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            {["Orange Money", "MTN MoMo", "Virement bancaire", "Espèces", "Autre"].map((m) => <option key={m}>{m}</option>)}
          </select></div>
        <div><label className="label">Référence de transaction</label><input className="input" required value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></div>
        <div><label className="label">Date du paiement</label><input className="input" type="date" value={f.paid_on} onChange={(e) => setF({ ...f, paid_on: e.target.value })} /></div>
      </div>
      <div><label className="label">Capture d&apos;écran (optionnel)</label><input className="input" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
      <button className="btn btn-primary" disabled={busy}>{busy ? "Envoi…" : "Soumettre ma preuve de paiement"}</button>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
    </form>
  );
}
