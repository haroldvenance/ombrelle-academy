import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { Plus, MoreHorizontal } from "lucide-react";
import { requireStaff } from "@/lib/auth";

export default async function Formations({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const { profile } = await requireStaff();
  const supabase = createClient();

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("formations").select("*", { count: "exact" });

  if (profile.role === "instructor") {
    query = query.eq("created_by", profile.id);
  }
  if (searchParams.q) {
    // On échappe les wildcards PostgREST
    const safe = searchParams.q.replace(/[%,()]/g, "");
    query = query.ilike("title", `%${safe}%`);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Formations</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez le catalogue de formations et leur contenu.</p>
        </div>
        <Link
          href="/admin/formations/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle formation
        </Link>
      </div>

      <form className="flex items-center gap-2 max-w-md">
        <input
          name="q"
          defaultValue={searchParams.q}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          placeholder="Rechercher une formation..."
        />
        <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Filtrer
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Formation</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data ?? []).map((f: any) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{f.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{f.difficulty} · {f.duration_days} jours</div>
                  </td>
                  <td className="px-6 py-4">{f.category}</td>
                  <td className="px-6 py-4 font-medium">{formatPrice(f.price, f.currency)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      f.status === "published"
                        ? "bg-emerald-100 text-emerald-800"
                        : f.status === "archived"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/formations/${f.id}`} className="text-slate-400 hover:text-slate-900">
                      <MoreHorizontal className="h-5 w-5 inline" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!data?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">Aucune formation trouvée</p>
                    <p className="mt-1 text-sm">
                      {searchParams.q
                        ? <>Aucun résultat pour « {searchParams.q} ». <Link className="underline" href="/admin/formations">Effacer la recherche</Link></>
                        : <>Créez votre première formation pour démarrer.</>}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {page} sur {totalPages} · {count} formation(s)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/formations?${new URLSearchParams({ ...(searchParams.q ? { q: searchParams.q } : {}), page: String(page - 1) })}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Précédent
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/formations?${new URLSearchParams({ ...(searchParams.q ? { q: searchParams.q } : {}), page: String(page + 1) })}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Suivant
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}