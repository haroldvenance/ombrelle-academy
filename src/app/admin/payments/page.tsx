import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PaymentReview from "@/components/admin/PaymentReview";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  PAYMENT_METHOD_LABEL,
} from "@/lib/utils";
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  UserX,
  FileX,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default async function Payments({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  await requireAdmin();
  const supabase = createClient();

  const status = searchParams.status;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("payments")
    .select(
      `*,
       profiles!payments_user_id_fkey(full_name, email),
       enrollments(formations(title)),
       verifier:profiles!payments_verified_by_fkey(full_name)`,
      { count: "exact" }
    );
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3"
      >
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800">Impossible de charger les paiements</p>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Signed URLs en batch (1 appel pour N preuves)
  const paths = (data ?? [])
    .map((p: any) => p.proof_url)
    .filter((u): u is string => typeof u === "string" && u.length > 0);

  const signedMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrls(paths, 600);

    for (const s of signed ?? []) {
      if (typeof s.path === "string" && s.path.length > 0 && s.signedUrl) {
        signedMap.set(s.path, s.signedUrl);
      }
    }
  }

  const rows = (data ?? []).map((p: any) => ({
    ...p,
    proof: p.proof_url ? signedMap.get(p.proof_url) ?? null : null,
    student_name: p.profiles?.full_name ?? null,
    student_email: p.profiles?.email ?? null,
    formation_title: p.enrollments?.formations?.title ?? null,
    verifier_name: p.verifier?.full_name ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> Validé
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
            <XCircle className="h-3.5 w-3.5" /> Échoué
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            <RefreshCw className="h-3.5 w-3.5" /> Remboursé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            <Clock className="h-3.5 w-3.5" /> En attente
          </span>
        );
    }
  };

  const filters: { label: string; value?: string }[] = [
    { label: "Tous", value: undefined },
    { label: "En attente", value: "pending" },
    { label: "Validés", value: "paid" },
    { label: "Échoués", value: "failed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Paiements</h1>
        <p className="text-sm text-slate-500 mt-1">
          Validez les preuves de paiement Mobile Money soumises par les étudiants.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filtrer les paiements par statut"
      >
        {filters.map((f) => {
          const active = (searchParams.status ?? "") === (f.value ?? "");
          const href = f.value
            ? `/admin/payments?status=${f.value}`
            : "/admin/payments";
          return (
            <Link
              key={f.label}
              href={href}
              role="tab"
              aria-selected={active}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                active
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Étudiant</th>
                <th scope="col" className="px-6 py-4">Formation / Paiement</th>
                <th scope="col" className="px-6 py-4">Montant</th>
                <th scope="col" className="px-6 py-4">Statut</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p: any) => {
                const studentDeleted = !p.student_name && !p.student_email;
                const enrollmentDeleted = !p.formation_title;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      {studentDeleted ? (
                        <div className="inline-flex items-center gap-1.5 text-slate-400 italic text-sm">
                          <UserX className="h-3.5 w-3.5" />
                          Compte supprimé
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-slate-900">
                            {p.student_name ?? "—"}
                          </div>
                          {p.student_email && (
                            <div className="text-xs text-slate-500 break-all">
                              {p.student_email}
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                      {enrollmentDeleted ? (
                        <div className="inline-flex items-center gap-1.5 text-slate-400 italic text-sm">
                          <FileX className="h-3.5 w-3.5" />
                          Inscription supprimée
                        </div>
                      ) : (
                        <div className="text-sm text-slate-900">{p.formation_title}</div>
                      )}
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span>
                          {PAYMENT_METHOD_LABEL[p.payment_method] ?? p.payment_method}
                        </span>
                        {" · Réf "}
                        <span className="font-mono">{p.transaction_reference}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Soumis le {formatDate(p.created_at)}
                        {p.paid_on && <> · Payé le {formatDate(p.paid_on)}</>}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top font-medium text-slate-900">
                      {formatPrice(p.amount, p.currency)}
                    </td>

                    <td className="px-6 py-4 align-top">
                      {getStatusBadge(p.status)}
                      {p.verified_at && (
                        <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          <div>
                            {p.status === "paid" ? "Validé" : "Refusé"} par{" "}
                            <span className="font-medium text-slate-700">
                              {p.verifier_name ?? "un administrateur"}
                            </span>
                          </div>
                          <div className="text-slate-400">
                            {formatDateTime(p.verified_at)}
                          </div>
                        </div>
                      )}
                      {p.admin_comment && (
                        <div className="text-xs text-slate-600 mt-1.5 max-w-xs italic">
                          « {p.admin_comment} »
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex flex-col items-end gap-2">
                        {p.proof ? (
                          <a
                            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                            href={p.proof}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Preuve <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : p.proof_url ? (
                          <span className="text-xs text-red-500 italic">
                            Fichier introuvable
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Aucune preuve
                          </span>
                        )}

                        {p.status === "pending" &&
                          (enrollmentDeleted ? (
                            <p className="text-xs text-slate-500 italic max-w-[180px]">
                              Validation impossible : inscription supprimée.
                            </p>
                          ) : (
                            <PaymentReview
                              id={p.id}
                              amount={p.amount}
                              currency={p.currency}
                              studentName={p.student_name ?? "l'étudiant"}
                              formationTitle={p.formation_title ?? "la formation"}
                            />
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">
                      Aucun paiement à afficher
                    </p>
                    <p className="mt-1 text-sm">
                      {status ? (
                        <>Aucun paiement avec ce statut.</>
                      ) : (
                        <>Aucun paiement enregistré pour le moment.</>
                      )}
                    </p>
                    {status && (
                      <Link
                        href="/admin/payments"
                        className="mt-3 inline-block text-sm font-medium text-slate-900 underline hover:text-slate-700"
                      >
                        Voir tous les paiements
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {page} sur {totalPages} · {count} paiement{(count ?? 0) > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/payments?${new URLSearchParams({
                  ...(status ? { status } : {}),
                  page: String(page - 1),
                })}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Précédent
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/payments?${new URLSearchParams({
                  ...(status ? { status } : {}),
                  page: String(page + 1),
                })}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Suivant
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}