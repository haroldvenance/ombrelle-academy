import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import { formatDate } from "@/lib/utils";
import { Award, History, Mail, ShieldCheck, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Gérez vos informations personnelles et vos préférences.",
};

export default async function Profile() {
  const { user, profile } = await requireUser();
  const supabase = createClient();

  const [{ data: settings }, { data: xp }, { data: badges }] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("xp_transactions")
      .select("amount, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("user_badges")
      .select("earned_at, badges(name, description)")
      .eq("user_id", user.id),
  ]);

  const initials = (profile.full_name ?? profile.username ?? user.email ?? "?")
    .toString()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-start gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-16 w-16 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-semibold">
            {initials || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 truncate">
            {profile.full_name || "Mon profil"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5 break-all">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {user.email}
            </span>
            {profile.created_at && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Membre depuis {formatDate(profile.created_at)}
              </span>
            )}
            {profile.role && profile.role !== "student" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs font-medium capitalize">
                <ShieldCheck className="h-3 w-3" /> {profile.role}
              </span>
            )}
          </div>
        </div>
      </div>

      <ProfileForm profile={profile} settings={settings} userEmail={user.email ?? ""} />

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Mes badges</h2>
            </div>
            <span className="text-xs text-slate-500">{badges?.length ?? 0}</span>
          </div>
          <div className="p-5 flex-1">
            {!badges?.length ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Aucun badge pour l&apos;instant. Continuez vos leçons pour en débloquer !
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((b: any, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 border border-indigo-100"
                    title={b.badges?.description}
                  >
                    {b.badges?.name ?? "Badge"}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Historique XP</h2>
            </div>
            <Link
              href="/profil/xp"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Tout voir
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {(xp ?? []).map((x: any, i: number) => {
              const reason = (x.reason ?? "autre")
                .toString()
                .replace(/_/g, " ");
              return (
                <li key={i} className="flex justify-between items-center px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-700 capitalize">{reason}</p>
                    <p className="text-xs text-slate-400">{formatDate(x.created_at)}</p>
                  </div>
                  <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                    +{x.amount} XP
                  </span>
                </li>
              );
            })}
            {!xp?.length && (
              <li className="p-5 text-sm text-slate-500 text-center">
                Aucune activité enregistrée.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}