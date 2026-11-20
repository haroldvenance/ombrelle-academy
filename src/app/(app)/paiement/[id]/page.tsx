import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PaymentForm from "@/components/PaymentForm";
import { formatDate, formatPrice } from "@/lib/utils";

const STATUS: Record<string, string> = { pending: "En vérification", paid: "Validé", failed: "Refusé", refunded: "Remboursé" };

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const { user } = await requireUser();
  const supabase = createClient();
  const { data: e } = await supabase.from("enrollments").select("*, formations(title, slug, price, currency)").eq("id", params.id).eq("user_id", user.id).maybeSingle();
  if (!e) notFound();
  const { data: payments } = await supabase.from("payments").select("*").eq("enrollment_id", e.id).order("created_at", { ascending: false });
  const paid = (payments ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const price = Number(e.formations.price);
  const remaining = Math.max(price - paid, 0);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-brand-900">Paiement — {e.formations.title}</h1>
      <div className="card space-y-1 text-sm">
        <p>Prix : <b>{formatPrice(price, e.formations.currency)}</b> · Validé : <b>{formatPrice(paid)}</b> · Reste : <b>{formatPrice(remaining)}</b></p>
        <p className="text-amber-700">{e.status === "active" ? "✅ Accès activé." : "L'accès est activé après validation de ton paiement par l'équipe."}</p>
        {e.status === "active" && <Link className="btn btn-primary mt-2" href={`/learning/${e.formations.slug}`}>Accéder à la formation</Link>}
      </div>
      {remaining > 0 && (<>
        <div className="card text-sm"><h2 className="mb-1 font-bold">Comment payer ?</h2><p className="text-slate-600">{process.env.NEXT_PUBLIC_PAYMENT_INSTRUCTIONS ?? "Les instructions de paiement seront communiquées par OMBRELLE."}</p></div>
        <div className="card"><h2 className="mb-3 font-bold">Soumettre une preuve</h2><PaymentForm enrollmentId={e.id} userId={user.id} defaultAmount={remaining} /></div>
      </>)}
      {!!payments?.length && <div className="card"><h2 className="mb-2 font-bold">Mes paiements</h2>
        <ul className="divide-y divide-slate-100 text-sm">{payments.map((p: any) => <li key={p.id} className="py-2"><div className="flex justify-between"><span>{formatPrice(p.amount, p.currency)} · {p.payment_method} · réf. {p.transaction_reference}</span><span className={`chip ${p.status === "paid" ? "chip-green" : p.status === "failed" ? "chip-red" : "chip-orange"}`}>{STATUS[p.status]}</span></div>
          <div className="text-xs text-slate-400">{formatDate(p.created_at)}{p.admin_comment ? ` — ${p.admin_comment}` : ""}</div></li>)}</ul></div>}
    </div>
  );
}
