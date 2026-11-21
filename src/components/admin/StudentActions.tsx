"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserCheck, UserX, GraduationCap, Loader2 } from "lucide-react";

export default function StudentActions({
  userId,
  currentUserId,
  suspended,
  role,
  formations,
  canSetRole,
}: {
  userId: string;
  currentUserId: string;
  suspended: boolean;
  role: string;
  formations: any[];
  canSetRole: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [fid, setFid] = useState(formations[0]?.id ?? "");
  const [busy, setBusy] = useState<null | "suspend" | "access" | "role">(null);
  const [error, setError] = useState<string | null>(null);

  const isSelf = userId === currentUserId;

  async function run(
    key: "suspend" | "access" | "role",
    p: PromiseLike<{ error: any }>,
    successMsg?: string
  ) {
    setBusy(key);
    setError(null);
    const { error } = await p;
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    if (successMsg) {
      // Silent on success; router.refresh suffit
    }
    router.refresh();
  }

  function toggleSuspend() {
    if (isSelf) return;
    const label = suspended ? "réactiver" : "suspendre";
    if (!confirm(`Confirmer : ${label} ce compte ?`)) return;
    run(
      "suspend",
      supabase.rpc("admin_set_suspended", { p_user: userId, p_value: !suspended })
    );
  }

  function grantAccess() {
    if (!fid) return;
    if (!confirm(`Donner accès à cette formation ?`)) return;
    run(
      "access",
      supabase.rpc("admin_grant_access", { p_user: userId, p_formation: fid })
    );
  }

  function changeRole(newRole: string) {
    if (!canSetRole || isSelf) return;
    if (newRole === role) return;
    if (
      !confirm(
        `Changer le rôle de ${role} à ${newRole} ? Cette action modifie les permissions du compte.`
      )
    ) {
      return;
    }
    run(
      "role",
      supabase.rpc("admin_set_role", { p_user: userId, p_role: newRole })
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleSuspend}
          disabled={isSelf || busy !== null}
          title={isSelf ? "Vous ne pouvez pas vous suspendre vous-même" : undefined}
        >
          {busy === "suspend" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : suspended ? (
            <UserCheck className="h-3.5 w-3.5" />
          ) : (
            <UserX className="h-3.5 w-3.5" />
          )}
          {suspended ? "Réactiver" : "Suspendre"}
        </button>

        <select
          className="input w-auto py-1 text-xs"
          value={fid}
          onChange={(e) => setFid(e.target.value)}
          aria-label="Formation"
          disabled={!formations.length || busy !== null}
        >
          {formations.length === 0 ? (
            <option value="">Aucune formation</option>
          ) : (
            formations.map((f) => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))
          )}
        </select>

        <button
          className="btn btn-secondary btn-sm"
          onClick={grantAccess}
          disabled={!fid || busy !== null}
        >
          {busy === "access" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <GraduationCap className="h-3.5 w-3.5" />
          )}
          Accès
        </button>

        {canSetRole && (
          <select
            className="input w-auto py-1 text-xs capitalize"
            value={role}
            onChange={(e) => changeRole(e.target.value)}
            aria-label="Rôle"
            disabled={isSelf || busy !== null}
            title={isSelf ? "Vous ne pouvez pas modifier votre propre rôle" : undefined}
          >
            {["student", "instructor", "admin", "superadmin"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}