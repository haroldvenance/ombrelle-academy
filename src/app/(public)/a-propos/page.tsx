import { Target, Heart, Shield, Users } from "lucide-react";

export default function About() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 py-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">Notre mission</h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          OMBRELLE Academy est née d'une conviction simple : on apprend mieux en pratiquant. 
          Nous démocratisons l'accès à l'éducation financière et entrepreneuriale en Afrique de l'Ouest.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Target className="h-8 w-8 text-indigo-600 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Apprentissage actif</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Fini les cours théoriques interminables. Nos formations intègrent des quiz, des simulations et des défis pratiques pour ancrer les connaissances.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Shield className="h-8 w-8 text-indigo-600 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Contenu fiable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Nos modules sur la BRVM, la crypto et le e-commerce sont conçus par des experts pour vous éviter les pièges classiques et les arnaques.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Users className="h-8 w-8 text-indigo-600 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Adapté à l'Afrique</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Nos exemples utilisent le Franc CFA, le Mobile Money et les réalités économiques locales pour être directement applicables à votre quotidien.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Heart className="h-8 w-8 text-indigo-600 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Gamification</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Gagnez des XP, débloquez des badges et suivez votre progression grâce à un système de récompenses conçu pour maintenir votre motivation.
          </p>
        </div>
      </div>
    </div>
  );
}