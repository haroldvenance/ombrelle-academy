import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import { formatDate } from "@/lib/utils";
import { Award, History } from "lucide-react";

export default async function Profile() {
  const { user, profile } = await requireUser();
  const supabase = createClient();
  
  const [{ data: settings }, { data: xp }, { data: badges }] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("xp_transactions").select("amount, reason, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15),
    supabase.from("user_badges").select("earned_at, badges(name, description)").eq("user_id", user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mon profil</h1>
        <p className="text-slate-500 mt-1">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      <ProfileForm profile={profile} settings={settings} />

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Mes badges</h2>
          </div>
          <div className="p-5 flex-1">
            {!badges?.length ? (
              <p className="text-sm text-slate-500 text-center py-4">Aucun badge pour l'instant.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((b: any, i: number) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 border border-indigo-100" title={b.badges?.description}>
                    {b.badges?.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Historique XP</h2>
          </div>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {(xp ?? []).map((x: any, i: number) => (
              <li key={i} className="flex justify-between items-center px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700 capitalize">{x.reason.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-400">{formatDate(x.created_at)}</p>
                </div>
                <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">+{x.amount} XP</span>
              </li>
            ))}
            {!xp?.length && <li className="p-5 text-sm text-slate-500 text-center">Aucune activité enregistrée.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}