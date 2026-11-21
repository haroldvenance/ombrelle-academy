import Link from "next/link";
import { TrendingUp, ShoppingBag, BookOpen, Clock, Layers } from "lucide-react";
import { DIFFICULTY_LABEL, formatPrice } from "@/lib/utils";

export default function FormationCard({
  f,
  moduleCount,
}: {
  f: any;
  moduleCount?: number;
}) {
  const FallbackIcon = f.category === "Digital" ? ShoppingBag : TrendingUp;

  return (
    <Link
      href={`/formations/${f.slug}`}
      aria-label={`Voir la formation ${f.title}`}
      className="card flex flex-col gap-3 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 to-accent-600">
        {f.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={f.cover_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <FallbackIcon className="h-10 w-10 text-white/80" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {f.category && <span className="chip chip-violet">{f.category}</span>}
        <span className="chip">
          <BookOpen className="h-3 w-3" aria-hidden="true" />
          {DIFFICULTY_LABEL[f.difficulty] ?? f.difficulty}
        </span>
        {f.duration_days && (
          <span className="chip">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {f.duration_days} jours
          </span>
        )}
        {moduleCount !== undefined && (
          <span className="chip">
            <Layers className="h-3 w-3" aria-hidden="true" />
            {moduleCount} module{moduleCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-brand-900">{f.title}</h3>
      <p className="line-clamp-3 flex-1 text-sm text-slate-600">{f.description}</p>

      <div className="flex items-center justify-between">
        <span className="font-bold text-brand-800">{formatPrice(f.price, f.currency)}</span>
        <span className="btn btn-primary btn-sm" aria-hidden="true">
          Découvrir
        </span>
      </div>
    </Link>
  );
}