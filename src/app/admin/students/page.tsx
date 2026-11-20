import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StudentActions from "@/components/admin/StudentActions";
import { formatDate } from "@/lib/utils";

export default async function Students({ searchParams }: { searchParams: { q?: string } }) {
  const { profile } = await requireStaff();
  const supabase = createClient();
  let q = supabase.from("profiles").select("*, user_stats(total_xp, level_number), enrollments(id, status, formations(title))").order("created_at", { ascending: false }).limit(100);
  if (searchParams.q) q = q.or(`full_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  const [{ data }, { data: formations }] = await Promise.all([q, supabase.from("formations").select("id, title")]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-900">Étudiants</h1>
      <form className="flex gap-2"><input name="q" defaultValue={searchParams.q} className="input max-w-sm" placeholder="Rechercher nom / email" /><button className="btn btn-secondary">Rechercher</button></form>
      <div className="space-y-2">{(data ?? []).map((p: any) => (
        <div key={p.id} className="card space-y-2 !p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><b>{p.full_name}</b> <span className="text-xs text-slate-500">{p.email}</span><div className="text-xs text-slate-400">inscrit le {formatDate(p.created_at)} · {p.user_stats?.total_xp ?? 0} XP · niv. {p.user_stats?.level_number ?? 1}</div></div>
            <div className="flex gap-1"><span className="chip">{p.role}</span>{p.is_suspended && <span className="chip chip-red">suspendu</span>}</div></div>
          <div className="text-xs text-slate-600">{(p.enrollments ?? []).map((e: any) => `${e.formations?.title} (${e.status})`).join(" · ") || "Aucune inscription"}</div>
          {["admin", "superadmin"].includes(profile.role) && <StudentActions userId={p.id} suspended={p.is_suspended} role={p.role} formations={formations ?? []} canSetRole={profile.role === "superadmin"} />}
        </div>))}</div>
    </div>
  );
}
