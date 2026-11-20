import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PaymentReview from "@/components/admin/PaymentReview";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function Payments() {
  await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase.from("payments").select("*, profiles!payments_user_id_fkey(full_name, email), enrollments(formations(title))").order("created_at", { ascending: false }).limit(100);
  const rows = await Promise.all((data ?? []).map(async (p: any) => {
    let proof: string | null = null;
    if (p.proof_url) { const { data: s } = await supabase.storage.from("payment-proofs").createSignedUrl(p.proof_url, 600); proof = s?.signedUrl ?? null; }
    return { ...p, proof };
  }));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-900">Paiements</h1>
      {rows.map((p: any) => (
        <div key={p.id} className="card space-y-2 !p-4">
          <div className="flex flex-wrap justify-between gap-2"><div><b>{formatPrice(p.amount, p.currency)}</b> — {p.profiles?.full_name} <span className="text-xs text-slate-500">{p.profiles?.email}</span>
            <div className="text-xs text-slate-500">{p.enrollments?.formations?.title} · {p.payment_method} · réf. {p.transaction_reference} · {formatDate(p.created_at)}</div></div>
            <span className={`chip ${p.status === "paid" ? "chip-green" : p.status === "failed" ? "chip-red" : "chip-orange"}`}>{p.status}</span></div>
          {p.proof && <a className="text-sm text-brand-700 underline" href={p.proof} target="_blank" rel="noreferrer">Voir la preuve</a>}
          {p.status === "pending" ? <PaymentReview id={p.id} /> : p.admin_comment && <p className="text-xs text-slate-500">Commentaire : {p.admin_comment}</p>}
        </div>))}
      {!rows.length && <p className="text-slate-500">Aucun paiement.</p>}
    </div>
  );
}
