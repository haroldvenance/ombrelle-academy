import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FormationCard from "@/components/FormationCard";
import { Target, Trophy, Smartphone, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default async function Home() {
  const supabase = createClient();
  const { data: formations } = await supabase.from("formations").select("*").eq("status", "published").order("created_at").limit(3);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white rounded-3xl mx-4 sm:mx-0 mt-4">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 px-6 py-20 sm:px-16 sm:py-28 max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-6 border border-indigo-500/30">
            <Zap className="h-4 w-4" /> La nouvelle façon d'apprendre la finance
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Apprenez en pratiquant.<br/>
            <span className="text-indigo-400">Progressez à votre rythme.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Maîtrisez la Bourse BRVM, l'investissement, la crypto et le e-commerce grâce à des formations interactives, des quiz et des défis concrets.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/formations" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-400 transition-colors">
              Découvrir les formations <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/inscription" className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 px-8 py-3.5 text-base font-semibold text-white hover:bg-slate-700 transition-colors">
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Pourquoi choisir OMBRELLE Academy ?</h2>
          <p className="text-slate-500 mt-2">Une méthode conçue pour les réalités africaines.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="mx-auto w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
              <Target className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Apprentissage actif</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Quiz, exercices et simulations. Vous êtes acteur de votre formation, pas un simple spectateur.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="mx-auto w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
              <Trophy className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Progression motivante</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Gagnez des XP, montez de niveau, débloquez des badges et maintenez votre série de jours d'apprentissage.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="mx-auto w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
              <Smartphone className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Pensé pour mobile</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Des leçons légères et rapides à charger. Apprenez depuis votre téléphone, où que vous soyez.</p>
          </div>
        </div>
      </section>

      {/* Formations Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Nos formations</h2>
            <p className="text-slate-500 mt-2">Commencez votre parcours dès aujourd'hui.</p>
          </div>
          <Link href="/formations" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Voir tout le catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(formations ?? []).map((f: any) => (
            <FormationCard key={f.id} f={f} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link href="/formations" className="inline-flex items-center justify-center w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Voir tout le catalogue
          </Link>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-indigo-50 rounded-3xl p-10 sm:p-16 text-center border border-indigo-100">
          <ShieldCheck className="h-12 w-12 text-indigo-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Prêt à prendre le contrôle de vos finances ?</h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto text-lg">Rejoignez des milliers d'apprenants et acquérez les compétences qui feront la différence.</p>
          <Link href="/inscription" className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-8 py-4 text-base font-semibold text-white hover:bg-slate-800 transition-colors">
            Commencer gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
}