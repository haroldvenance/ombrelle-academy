"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserCheck, UserX, GraduationCap } from "lucide-react";

export default function StudentActions({
  userId, suspended, role, formations, canSetRole,
}: { userId: string; suspended: boolean; role: string; formations: any[]; canSetRole: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [fid, setFid] = useState(formations[0]?.id ?? "");

  const run = async (p: PromiseLike<{ error: any }>) => {
    const { error } = await p;
    if (error) alert(error.message);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => run(supabase.rpc("admin_set_suspended", { p_user: userId, p_value: !suspended }))}
      >
        {suspended ? <><UserCheck className="h-3.5 w-3.5" /> Réactiver</> : <><UserX className="h-3.5 w-3.5" /> Suspendre</>}
      </button>

      <select
        className="input !w-auto !py-1 text-xs"
        value={fid}
        onChange={(e) => setFid(e.target.value)}
        aria-label="Formation"
      >
        {formations.map((f) => (
          <option key={f.id} value={f.id}>{f.title}</option>
        ))}
      </select>

      <button
        className="btn btn-secondary btn-sm"
        onClick={() => run(supabase.rpc("admin_grant_access", { p_user: userId, p_formation: fid }))}
      >
        <GraduationCap className="h-3.5 w-3.5" /> Accès
      </button>

      {canSetRole && (
        <select
          className="input !w-auto !py-1 text-xs capitalize"
          value={role}
          onChange={(e) => run(supabase.rpc("admin_set_role", { p_user: userId, p_role: e.target.value }))}
          aria-label="Rôle"
        >
          {["student", "instructor", "admin", "superadmin"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      )}
    </div>
  );
}