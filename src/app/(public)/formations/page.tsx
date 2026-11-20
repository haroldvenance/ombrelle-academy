import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FormationCard from "@/components/FormationCard";

export default async function Catalogue({ searchParams }: { searchParams: { category?: string; level?: string; price?: string } }) {
  const supabase = createClient();
  let q = supabase.from("formations").select("*, formation_modules(count)").eq("status", "published").order("created_at");
  if (searchParams.category) q = q.eq("category", searchParams.category);
  if (searchParams.level) q = q.eq("difficulty", searchParams.level);
  if (searchParams.price === "free") q = q.eq("price", 0);
  if (searchParams.price === "paid") q = q.gt("price", 0);
  const { data } = await q;
  const chip = (label: string, href: string, active: boolean) => <Link key={label} href={href} className={`chip ${active ? "!bg-brand-700 !text-white" : ""}`}>{label}</Link>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brand-900">Catalogue des formations</h1>
      <div className="flex flex-wrap gap-2">
        {chip("Toutes", "/formations", !searchParams.category && !searchParams.level && !searchParams.price)}
        {chip("Finance", "/formations?category=Finance", searchParams.category === "Finance")}
        {chip("Digital", "/formations?category=Digital", searchParams.category === "Digital")}
        {chip("Débutant", "/formations?level=beginner", searchParams.level === "beginner")}
        {chip("Gratuites", "/formations?price=free", searchParams.price === "free")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((f: any) => <FormationCard key={f.id} f={f} moduleCount={f.formation_modules?.[0]?.count ?? 0} />)}
      </div>
      {!data?.length && <p className="text-slate-500">Aucune formation ne correspond.</p>}
    </div>
  );
}
