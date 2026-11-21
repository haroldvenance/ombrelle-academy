import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PaymentReview from "@/components/admin/PaymentReview";
import { formatDate, formatPrice } from "@/lib/utils";
import { ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";

export default async function Payments() {
  await requireAdmin();
  const supabase = createClient();
  
  const { data } = await supabase
    .from("payments")
    .select("*, profiles!payments_user_id_fkey(full_name, email), enrollments(formations(title))")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = await Promise.all((data ?? []).map(async (p: any) => {
    let proof: string | null = null;
    if (p.proof_url) { 
      const { data: s } = await supabase.storage.from("payment-proofs").createSignedUrl(p.proof_url, 600); 
      proof = s?.signedUrl ?? null; 
    }
    return { ...p, proof };
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5"/> Validé</span>;
      case "failed": return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800"><XCircle className="h-3.5 w-3.5"/> Échoué</span>;
      default: return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"><Clock className="h-3.5 w-3.5"/> En attente</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Paiements</h1>
        <p className="text-sm text-slate-500 mt-1">Validez les preuves de paiement Mobile Money soumises par les étudiants.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Formation</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{p.profiles?.full_name}</div>
                    <div className="text-xs text-slate-500">{p.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{p.enrollments?.formations?.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Réf: {p.transaction_reference} · {formatDate(p.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatPrice(p.amount, p.currency)}</td>
                  <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {p.proof && (
                      <a className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900" href={p.proof} target="_blank" rel="noreferrer">
                        Preuve <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {p.status === "pending" && <PaymentReview id={p.id} />}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Aucun paiement à afficher.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}