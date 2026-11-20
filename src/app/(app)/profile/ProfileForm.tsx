"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({ profile, settings }: { profile: any; settings: any }) {
  const router = useRouter();
  const [p, setP] = useState({ full_name: profile.full_name ?? "", username: profile.username ?? "", phone: profile.phone ?? "", country: profile.country ?? "", bio: profile.bio ?? "", timezone: profile.timezone ?? "Africa/Douala" });
  const [s, setS] = useState({ leaderboard_visibility: settings?.leaderboard_visibility ?? true, email_notifications: settings?.email_notifications ?? true, notifications_enabled: settings?.notifications_enabled ?? true, learning_mode_default: settings?.learning_mode_default ?? "classic" });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const supabase = createClient();
    const r1 = await supabase.from("profiles").update(p).eq("id", profile.id);
    if (r1.error) { setMsg({ ok: false, t: r1.error.code === "23505" ? "Ce pseudonyme est déjà pris." : r1.error.message }); return; }
    const r2 = await supabase.from("user_settings").update(s).eq("user_id", profile.id);
    if (r2.error) { setMsg({ ok: false, t: r2.error.message }); return; }
    setMsg({ ok: true, t: "Profil enregistré." }); router.refresh();
  }
  const Check = ({ k, label }: { k: "leaderboard_visibility" | "email_notifications" | "notifications_enabled"; label: string }) =>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} />{label}</label>;
  return (
    <form onSubmit={save} className="card space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Nom complet</label><input className="input" value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} /></div>
        <div><label className="label">Pseudonyme (classement)</label><input className="input" value={p.username} onChange={(e) => setP({ ...p, username: e.target.value })} /></div>
        <div><label className="label">Téléphone</label><input className="input" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
        <div><label className="label">Pays</label><input className="input" value={p.country} onChange={(e) => setP({ ...p, country: e.target.value })} /></div>
        <div><label className="label">Fuseau horaire (calcul des séries)</label><input className="input" value={p.timezone} onChange={(e) => setP({ ...p, timezone: e.target.value })} /></div>
        <div><label className="label">Mode par défaut</label><select className="input" value={s.learning_mode_default} onChange={(e) => setS({ ...s, learning_mode_default: e.target.value })}><option value="classic">Classique</option><option value="interactive">Interactif</option><option value="intensive">Intensif</option></select></div>
      </div>
      <div><label className="label">Bio</label><textarea className="input" rows={2} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} /></div>
      <Check k="leaderboard_visibility" label="Apparaître dans les classements" />
      <Check k="notifications_enabled" label="Notifications internes" />
      <Check k="email_notifications" label="Notifications par email" />
      <button className="btn btn-primary">Enregistrer</button>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.t}</p>}
    </form>
  );
}
