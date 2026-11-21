import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrent } from "@/lib/auth";
import EnrollButton from "@/components/EnrollButton";
import { DIFFICULTY_LABEL, formatPrice } from "@/lib/utils";
import { CheckCircle2, BookOpen, Clock, BarChart, PlayCircle, Lock } from "lucide-react";

export default async function FormationPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  
  const { data: f } = await supabase.from("formations").select("*").eq("slug", params.slug).eq("status", "published").maybeSingle();
  if (!f) notFound();
  
  const [{ data: modules }, { data: lessons }, current] = await Promise.all([
    supabase.from("formation_modules").select("*").eq("formation_id", f.id).order("position"),
    supabase.from("lesson_outline").select("*").eq("formation_id", f.id).order("position"),
    getCurrent(),
  ]);
  
  let enrollment: any = null;
  if (current) {
    const { data } = await supabase.from("enrollments").select("*").eq("user_id", current.user.id).eq("formation_id", f.id).neq("status", "cancelled").maybeSingle();
    enrollment = data;
  }
  
  const access = enrollment && ["active", "completed"].includes(enrollment.status);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* En-tête de la formation */}
      <div className="rounded-2xl bg-slate-900 px-6 py-12 sm:px-12 text-white overflow-hidden relative">
        {f.cover_url && (
          <div className="absolute inset-0 opacity-20">
            <img src={f.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm font-medium">
            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">{f.category}</span>
            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full border border-slate-600/50 flex items-center gap-1">
              <BarChart className="h-3.5 w-3.5" /> {DIFFICULTY_LABEL[f.difficulty]}
            </span>
            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full border border-slate-600/50 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {f.duration_days} jours
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{f.title}</h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">{f.description}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Contenu principal */}
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ce que vous allez apprendre</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {(f.objectives ?? []).map((o: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">Programme de la formation</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(modules ?? []).map((m: any, i: number) => (
                <div key={m.id} className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs">{i + 1}</span>
                    {m.title}
                  </h3>
                  <ul className="space-y-2">
                    {(lessons ?? []).filter((l: any) => l.module_id === m.id).map((l: any) => (
                      <li key={l.id} className="flex items-center justify-between text-sm text-slate-600 pl-8 py-1">
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-slate-400" />
                          {l.title}
                        </span>
                        {l.estimated_duration && <span className="text-xs text-slate-400">{l.estimated_duration} min</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Barre latérale (Achat/Accès) */}
        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
          <div className="text-3xl font-extrabold text-slate-900 mb-2">
            {Number(f.price) === 0 ? "Gratuit" : formatPrice(f.price, f.currency)}
          </div>
          <p className="text-sm text-slate-500 mb-6">Accès à vie et mises à jour incluses.</p>

          <div className="space-y-3">
            {!current && (
              <>
                <Link href="/inscription" className="w-full flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                  Créer un compte pour s'inscrire
                </Link>
                <Link href="/connexion" className="w-full flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  J'ai déjà un compte
                </Link>
              </>
            )}
            
            {current && !enrollment && (
              <EnrollButton formationId={f.id} free={Number(f.price) === 0} />
            )}
            
            {current && enrollment && access && (
              <Link href={`/learning/${f.slug}`} className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                <PlayCircle className="h-5 w-5" /> Continuer la formation
              </Link>
            )}
            
            {current && enrollment && !access && (
              <>
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-100 mb-3">
                  <p className="text-xs text-amber-800 font-medium">Accès en attente</p>
                  <p className="text-xs text-amber-700 mt-1">Votre paiement est en cours de vérification.</p>
                </div>
                <Link href={`/paiement/${enrollment.id}`} className="w-full flex items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors">
                  Gérer mon paiement
                </Link>
              </>
            )}
          </div>
          
          <ul className="mt-6 space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Accès immédiat après validation</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Certificat de réussite</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Support par email</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}