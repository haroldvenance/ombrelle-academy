import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FormationCard from "@/components/FormationCard";
import { Filter, Search } from "lucide-react";

export default async function Catalogue({ searchParams }: { searchParams: { category?: string; level?: string; price?: string } }) {
  const supabase = createClient();
  
  let q = supabase.from("formations").select("*, formation_modules(count)").eq("status", "published").order("created_at");
  if (searchParams.category) q = q.eq("category", searchParams.category);
  if (searchParams.level) q = q.eq("difficulty", searchParams.level);
  if (searchParams.price === "free") q = q.eq("price", 0);
  if (searchParams.price === "paid") q = q.gt("price", 0);
  
  const { data } = await q;

  const chip = (label: string, href: string, active: boolean) => (
    <Link 
      key={label} 
      href={href} 
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Catalogue des formations</h1>
          <p className="text-slate-500 mt-2">Découvrez nos parcours pour maîtriser vos finances et développer votre business.</p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100/50 rounded-xl border border-slate-200/60 w-fit">
        <div className="px-3 text-slate-400"><Filter className="h-4 w-4" /></div>
        {chip("Toutes", "/formations", !searchParams.category && !searchParams.level && !searchParams.price)}
        {chip("Finance", "/formations?category=Finance", searchParams.category === "Finance")}
        {chip("Digital", "/formations?category=Digital", searchParams.category === "Digital")}
        {chip("Débutant", "/formations?level=beginner", searchParams.level === "beginner")}
        {chip("Gratuites", "/formations?price=free", searchParams.price === "free")}
      </div>

      {/* Grille de résultats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((f: any) => (
          <FormationCard key={f.id} f={f} moduleCount={f.formation_modules?.[0]?.count ?? 0} />
        ))}
      </div>
      
      {!data?.length && (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
          <Search className="h-10 w-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Aucun résultat</h3>
          <p className="text-slate-500 mt-1">Aucune formation ne correspond à vos critères de recherche.</p>
          <Link href="/formations" className="text-indigo-600 font-medium hover:underline mt-4 inline-block">Réinitialiser les filtres</Link>
        </div>
      )}
    </div>
  );
}