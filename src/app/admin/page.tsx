import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function AdminHome() {
  const supabase = createClient();
  const [{ data: s }, { data: qs }] = await Promise.all([supabase.rpc("admin_stats"), supabase.rpc("question_stats", { p_limit: 5 })]);
  const st: any = s ?? {};
  const cards = [["Étudiants", st.students], ["Inscriptions actives", st.active_enrollments], ["Formations publiées", st.formations], ["Revenus validés", formatPrice(st.revenue ?? 0)],
    ["Paiements en attente", st.pending_payments], ["Progression moyenne", `${st.avg_progress ?? 0} %`], ["Taux de complétion", `${st.completion_rate ?? 0} %`], ["Actifs (7 j)", st.active_students_7d]];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([l, v]) => <div key={l as string} className="card !p-4"><div className="text-xs text-slate-500">{l}</div><div className="text-2xl font-bold text-brand-800">{v ?? 0}</div></div>)}</div>
      {st.pending_payments > 0 && <Link href="/admin/payments" className="btn btn-accent">Vérifier {st.pending_payments} paiement(s) en attente</Link>}
      <section className="card"><h2 className="mb-2 font-bold">Questions les plus ratées</h2>
        {!(qs as any[])?.length ? <p className="text-sm text-slate-500">Pas encore de données.</p> :
          <ul className="divide-y divide-slate-100 text-sm">{(qs as any[]).map((q) => <li key={q.question_id} className="flex justify-between gap-3 py-2"><span>{q.question_text}</span><span className="whitespace-nowrap text-slate-500">{q.success_rate} % réussite · {q.attempts} rép.</span></li>)}</ul>}</section>
    </div>
  );
}
