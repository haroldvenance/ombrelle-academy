import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import { formatDate } from "@/lib/utils";

export default async function Profile() {
  const { user, profile } = await requireUser();
  const supabase = createClient();
  const [{ data: settings }, { data: xp }, { data: badges }] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("xp_transactions").select("amount, reason, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15),
    supabase.from("user_badges").select("earned_at, badges(name, description)").eq("user_id", user.id),
  ]);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Mon profil</h1>
      <ProfileForm profile={profile} settings={settings} />
      <section className="card"><h2 className="mb-2 font-bold">Mes badges</h2>
        {!badges?.length ? <p className="text-sm text-slate-500">Aucun badge pour l&apos;instant.</p> : <div className="flex flex-wrap gap-2">{badges.map((b: any, i: number) => <span key={i} className="chip chip-violet" title={b.badges?.description}>🏅 {b.badges?.name}</span>)}</div>}</section>
      <section className="card"><h2 className="mb-2 font-bold">Historique XP</h2>
        <ul className="divide-y divide-slate-100 text-sm">{(xp ?? []).map((x: any, i: number) => <li key={i} className="flex justify-between py-2"><span>{x.reason}<span className="ml-2 text-xs text-slate-400">{formatDate(x.created_at)}</span></span><b className="text-accent-700">+{x.amount}</b></li>)}</ul></section>
    </div>
  );
}
