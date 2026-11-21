import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { Users, Activity, BookOpen, Banknote, Clock, TrendingUp, CheckCircle, RefreshCw } from "lucide-react";

export default async function AdminHome() {
  const supabase = createClient();
  const [{ data: s }, { data: qs }] = await Promise.all([
    supabase.rpc("admin_stats"), 
    supabase.rpc("question_stats", { p_limit: 5 })
  ]);
  
  const st: any = s ?? {};
  
  const cards = [
    { label: "Étudiants", value: st.students ?? 0, icon: Users },
    { label: "Inscriptions actives", value: st.active_enrollments ?? 0, icon: Activity },
    { label: "Formations publiées", value: st.formations ?? 0, icon: BookOpen },
    { label: "Revenus validés", value: formatPrice(st.revenue ?? 0), icon: Banknote },
    { label: "Paiements en attente", value: st.pending_payments ?? 0, icon: Clock },
    { label: "Progression moyenne", value: `${st.avg_progress ?? 0} %`, icon: TrendingUp },
    { label: "Taux de complétion", value: `${st.completion_rate ?? 0} %`, icon: CheckCircle },
    { label: "Actifs (7 derniers jours)", value: st.active_students_7d ?? 0, icon: RefreshCw },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500 mt-1">Vue d'ensemble de l'activité de la plateforme.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <card.icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {st.pending_payments > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              Vous avez <strong>{st.pending_payments}</strong> paiement(s) en attente de validation.
            </p>
          </div>
          <Link href="/admin/payments" className="text-sm font-medium text-amber-700 hover:text-amber-900 underline">
            Vérifier maintenant
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Questions les plus échouées</h2>
          </div>
          <div className="p-6">
            {!(qs as any[])?.length ? (
              <p className="text-sm text-slate-500">Aucune donnée disponible pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(qs as any[]).map((q) => (
                  <li key={q.question_id} className="flex justify-between gap-4 py-3">
                    <span className="text-sm text-slate-700 line-clamp-2">{q.question_text}</span>
                    <span className="whitespace-nowrap text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md h-fit">
                      {q.success_rate} % réussite
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Section pour préparer les Quêtes & Défis */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Moteur de révision espacée</h2>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full font-medium">Bêta</span>
          </div>
          <div className="p-6 flex flex-col items-center justify-center text-center h-48">
             <RefreshCw className="h-8 w-8 text-slate-300 mb-3" />
             <p className="text-sm text-slate-500 max-w-xs">Le module de révision espacée est prêt en base de données. L'interface de session sera disponible prochainement.</p>
          </div>
        </section>
      </div>
    </div>
  );
}