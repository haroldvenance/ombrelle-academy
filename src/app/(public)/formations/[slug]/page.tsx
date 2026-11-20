import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrent } from "@/lib/auth";
import EnrollButton from "@/components/EnrollButton";
import { DIFFICULTY_LABEL, formatPrice } from "@/lib/utils";

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
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <div className="flex flex-wrap gap-2"><span className="chip chip-violet">{f.category}</span><span className="chip">{DIFFICULTY_LABEL[f.difficulty]}</span>{f.duration_days && <span className="chip">{f.duration_days} jours</span>}</div>
          <h1 className="mt-2 text-3xl font-bold text-brand-900">{f.title}</h1>
          <p className="mt-2 text-slate-700">{f.description}</p>
        </div>
        <section className="card"><h2 className="mb-2 font-bold text-brand-900">Objectifs</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">{(f.objectives ?? []).map((o: string, i: number) => <li key={i}>{o}</li>)}</ul></section>
        <section className="card"><h2 className="mb-3 font-bold text-brand-900">Programme</h2>
          <div className="space-y-4">
            {(modules ?? []).map((m: any, i: number) => (
              <div key={m.id}><h3 className="font-semibold">Module {i + 1} — {m.title}</h3>
                <ul className="mt-1 space-y-1 text-sm text-slate-600">{(lessons ?? []).filter((l: any) => l.module_id === m.id).map((l: any) => <li key={l.id}>• {l.title}{l.estimated_duration ? ` (${l.estimated_duration} min)` : ""}</li>)}</ul></div>
            ))}
          </div>
        </section>
      </div>
      <aside className="card h-fit space-y-4 lg:sticky lg:top-20">
        <div className="text-2xl font-extrabold text-brand-800">{formatPrice(f.price, f.currency)}</div>
        {!current && <><Link href={`/inscription`} className="btn btn-primary w-full">Créer un compte pour s&apos;inscrire</Link><Link href="/connexion" className="btn btn-secondary w-full">J&apos;ai déjà un compte</Link></>}
        {current && !enrollment && <EnrollButton formationId={f.id} free={Number(f.price) === 0} />}
        {current && enrollment && access && <Link href={`/learning/${f.slug}`} className="btn btn-primary w-full">Continuer la formation</Link>}
        {current && enrollment && !access && <><p className="text-sm text-amber-700">Inscription en attente de validation du paiement.</p><Link href={`/paiement/${enrollment.id}`} className="btn btn-accent w-full">Gérer mon paiement</Link></>}
      </aside>
    </div>
  );
}
