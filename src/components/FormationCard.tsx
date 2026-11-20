import Link from "next/link";
import { DIFFICULTY_LABEL, formatPrice } from "@/lib/utils";

export default function FormationCard({ f, moduleCount }: { f: any; moduleCount?: number }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-4xl">
        {f.cover_image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.cover_image} alt="" className="h-full w-full rounded-xl object-cover" /> : (f.category === "Digital" ? "🛒" : "📈")}
      </div>
      <div className="flex flex-wrap gap-2">
        {f.category && <span className="chip chip-violet">{f.category}</span>}
        <span className="chip">{DIFFICULTY_LABEL[f.difficulty] ?? f.difficulty}</span>
        {f.duration_days && <span className="chip">{f.duration_days} jours</span>}
        {moduleCount !== undefined && <span className="chip">{moduleCount} modules</span>}
      </div>
      <h3 className="text-lg font-bold text-brand-900">{f.title}</h3>
      <p className="line-clamp-3 flex-1 text-sm text-slate-600">{f.description}</p>
      <div className="flex items-center justify-between">
        <span className="font-bold text-brand-800">{formatPrice(f.price, f.currency)}</span>
        <Link href={`/formations/${f.slug}`} className="btn btn-primary btn-sm">Découvrir</Link>
      </div>
    </div>
  );
}
