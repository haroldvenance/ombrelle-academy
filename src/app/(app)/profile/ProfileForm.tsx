"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Save } from "lucide-react";

export default function ProfileForm({ profile, settings }: { profile: any; settings: any }) {
  const router = useRouter();
  const [p, setP] = useState({ 
    full_name: profile.full_name ?? "", 
    username: profile.username ?? "", 
    phone: profile.phone ?? "", 
    country: profile.country ?? "", 
    bio: profile.bio ?? "", 
    timezone: profile.timezone ?? "Africa/Douala" 
  });
  const [s, setS] = useState({ 
    leaderboard_visibility: settings?.leaderboard_visibility ?? true, 
    email_notifications: settings?.email_notifications ?? true, 
    notifications_enabled: settings?.notifications_enabled ?? true, 
    learning_mode_default: settings?.learning_mode_default ?? "classic" 
  });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault(); 
    setMsg(null);
    setLoading(true);
    const supabase = createClient();
    
    const r1 = await supabase.from("profiles").update(p).eq("id", profile.id);
    if (r1.error) { 
      setMsg({ ok: false, t: r1.error.code === "23505" ? "Ce pseudonyme est déjà pris." : r1.error.message }); 
      setLoading(false);
      return; 
    }
    
    const r2 = await supabase.from("user_settings").update(s).eq("user_id", profile.id);
    if (r2.error) { 
      setMsg({ ok: false, t: r2.error.message }); 
      setLoading(false);
      return; 
    }
    
    setMsg({ ok: true, t: "Profil enregistré avec succès." }); 
    setLoading(false);
    router.refresh();
  }

  const Check = ({ k, label }: { k: "leaderboard_visibility" | "email_notifications" | "notifications_enabled"; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input 
          type="checkbox" 
          checked={s[k]} 
          onChange={(e) => setS({ ...s, [k]: e.target.checked })} 
          className="peer appearance-none w-5 h-5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer"
        />
        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
    </label>
  );

  return (
    <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pseudonyme (classement)</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" value={p.username} onChange={(e) => setP({ ...p, username: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pays</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" value={p.country} onChange={(e) => setP({ ...p, country: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fuseau horaire (séries)</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" value={p.timezone} onChange={(e) => setP({ ...p, timezone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mode d'apprentissage par défaut</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" value={s.learning_mode_default} onChange={(e) => setS({ ...s, learning_mode_default: e.target.value })}>
              <option value="classic">Classique</option>
              <option value="interactive">Interactif</option>
              <option value="intensive">Intensif</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
          <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" rows={3} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} />
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-medium text-slate-900 mb-3">Préférences</h3>
          <Check k="leaderboard_visibility" label="Apparaître dans les classements publics" />
          <Check k="notifications_enabled" label="Recevoir les notifications internes" />
          <Check k="email_notifications" label="Recevoir les notifications par email" />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
        <div>
          {msg && <p className={`text-sm font-medium ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.t}</p>}
        </div>
        <button 
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}