import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FormationCard from "@/components/FormationCard";

export default async function Home() {
  const supabase = createClient();
  const { data: formations } = await supabase.from("formations").select("*").eq("status", "published").order("created_at").limit(3);
  return (
    <div className="space-y-14">
      <section className="rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-accent-600 px-6 py-14 text-center text-white sm:px-12">
        <h1 className="text-3xl font-extrabold sm:text-5xl">Apprends en pratiquant.<br />Progresse à ton rythme.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-100">Bourse BRVM, investissement, crypto, e-commerce et Mobile Money : des formations interactives avec quiz, défis, XP et badges.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/formations" className="btn bg-white text-brand-800 hover:bg-brand-50">Voir les formations</Link>
          <Link href="/inscription" className="btn border border-white/50 text-white hover:bg-white/10">Créer un compte</Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[["🎯", "Apprentissage actif", "Quiz, exercices et simulations : tu es acteur, pas spectateur."],
          ["🏅", "Progression motivante", "XP, niveaux, badges et séries qui récompensent la compréhension."],
          ["📱", "Pensé pour mobile", "Des leçons textuelles légères, rapides à charger, partout."]].map(([i, t, d]) => (
          <div key={t} className="card"><div className="text-3xl">{i}</div><h3 className="mt-2 font-bold text-brand-900">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>
        ))}
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-bold text-brand-900">Nos formations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(formations ?? []).map((f: any) => <FormationCard key={f.id} f={f} />)}</div>
      </section>
    </div>
  );
}
