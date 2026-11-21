import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StudentActions from "@/components/admin/StudentActions";
import { formatDate } from "@/lib/utils";
import { Search, ShieldAlert } from "lucide-react";

export default async function Students({ searchParams }: { searchParams: { q?: string } }) {
  const { profile } = await requireStaff();
  const supabase = createClient();
  
  let q = supabase
    .from("profiles")
    .select("*, user_stats(total_xp, level_number), enrollments(id, status, formations(title))")
    .order("created_at", { ascending: false })
    .limit(100);
    
  if (searchParams.q) {
    q = q.or(`full_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  }
  
  const [{ data }, { data: formations }] = await Promise.all([
    q, 
    supabase.from("formations").select("id, title")
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Étudiants</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les comptes, les rôles et les accès aux formations.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <form>
            <input 
              name="q" 
              defaultValue={searchParams.q} 
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
              placeholder="Rechercher par nom ou email..." 
            />
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Progression</th>
                <th className="px-6 py-4">Rôle / Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data ?? []).map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{p.full_name}</div>
                    <div className="text-xs text-slate-500">{p.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{p.user_stats?.total_xp ?? 0} XP · Niveau {p.user_stats?.level_number ?? 1}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {(p.enrollments ?? []).map((e: any) => `${e.formations?.title} (${e.status})`).join(" · ") || "Aucune inscription"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 capitalize">
                        {p.role}
                      </span>
                      {p.is_suspended && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          <ShieldAlert className="h-3 w-3" /> Suspendu
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {["admin", "superadmin"].includes(profile.role) && (
                      <StudentActions 
                        userId={p.id} 
                        suspended={p.is_suspended} 
                        role={p.role} 
                        formations={formations ?? []} 
                        canSetRole={profile.role === "superadmin"} 
                      />
                    )}
                  </td>
                </tr>
              ))}
              {!data?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Aucun étudiant trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}