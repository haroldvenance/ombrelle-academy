import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PaymentForm from "@/components/PaymentForm";
import { formatDate, formatPrice } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, CreditCard } from "lucide-react";

const STATUS: Record<string, { label: string; color: string; icon: any }> = { 
  pending: { label: "En vérification", color: "text-amber-700 bg-amber-100", icon: Clock }, 
  paid: { label: "Validé", color: "text-emerald-700 bg-emerald-100", icon: CheckCircle2 }, 
  failed: { label: "Refusé", color: "text-red-700 bg-red-100", icon: XCircle }, 
  refunded: { label: "Remboursé", color: "text-slate-700 bg-slate-100", icon: CreditCard } 
};

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Paiement</h1>
        <p className="text-slate-500 mt-1">{e.formations.title}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-100">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Prix total</p>
            <p className="font-semibold text-slate-900">{formatPrice(price, e.formations.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Déjà payé</p>
            <p className="font-semibold text-emerald-600">{formatPrice(paid)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Reste à payer</p>
            <p className="font-semibold text-slate-900">{formatPrice(remaining)}</p>
          </div>
        </div>
      </div>

      {e.status === "active" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <h2 className="font-semibold text-emerald-900 mb-1">Accès activé</h2>
          <p className="text-sm text-emerald-700 mb-4">Votre paiement a été validé. Vous pouvez accéder à la formation.</p>
          <Link className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors" href={`/learning/${e.formations.slug}`}>
            Accéder à la formation
          </Link>
        </div>
      ) : remaining > 0 && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-2">Instructions de paiement</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {process.env.NEXT_PUBLIC_PAYMENT_INSTRUCTIONS ?? "Veuillez effectuer le transfert Mobile Money vers le compte de l'école et soumettre la preuve ci-dessous. Votre accès sera débloqué dès validation par un administrateur."}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Soumettre une preuve de paiement</h2>
            <PaymentForm enrollmentId={e.id} userId={user.id} defaultAmount={remaining} />
          </div>
        </>
      )}

      {!!payments?.length && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900">Historique des tentatives</h2>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
            {payments.map((p: any) => {
              const st = STATUS[p.status] || STATUS.pending;
              return (
                <div key={p.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{formatPrice(p.amount, p.currency)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.payment_method} · Réf: {p.transaction_reference}
                    </p>
                    {p.admin_comment && <p className="text-xs text-red-600 mt-1">Motif : {p.admin_comment}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${st.color}`}>
                      <st.icon className="h-3 w-3" /> {st.label}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(p.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}