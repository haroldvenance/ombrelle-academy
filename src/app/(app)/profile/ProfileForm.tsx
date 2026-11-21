"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

const TIMEZONES: string[] = [
  "Africa/Brazzaville",
  "Africa/Douala",
  "Africa/Kinshasa",
  "Africa/Libreville",
  "Africa/Porto-Novo",
  "Africa/Lome",
  "Africa/Ouagadougou",
  "Africa/Bamako",
  "Africa/Conakry",
  "Africa/Abidjan",
  "Africa/Dakar",
  "Africa/Bangui",
  "Africa/Ndjamena",
  "Africa/Bujumbura",
  "Africa/Kigali",
  "Africa/Luanda",
  "Africa/Sao_Tome",
  "Africa/Accra",
  "Africa/Lagos",
  "Africa/Casablanca",
  "Africa/Algiers",
  "Africa/Tunis",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/Paris",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Brussels",
  "America/New_York",
  "America/Los_Angeles",
  "America/Montreal",
  "Asia/Dubai",
  "UTC",
];

const DEFAULT_TZ = "Africa/Brazzaville";

type Msg = { ok: boolean; t: string } | null;

export default function ProfileForm({
  profile,
  settings,
  userEmail,
}: {
  profile: any;
  settings: any;
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const initialTz = profile.timezone ?? DEFAULT_TZ;
  const tzOptions = TIMEZONES.includes(initialTz)
    ? TIMEZONES
    : [initialTz, ...TIMEZONES];

  const [p, setP] = useState({
    full_name: profile.full_name ?? "",
    username: profile.username ?? "",
    phone: profile.phone ?? "",
    country: profile.country ?? "",
    bio: profile.bio ?? "",
    avatar_url: profile.avatar_url ?? "",
    timezone: initialTz,
  });

  const [s, setS] = useState({
    leaderboard_visibility: settings?.leaderboard_visibility ?? true,
    email_notifications: settings?.email_notifications ?? true,
    notifications_enabled: settings?.notifications_enabled ?? true,
    learning_mode_default: (settings?.learning_mode_default ?? "classic") as
      | "classic"
      | "interactive"
      | "intensive",
  });

  const [msg, setMsg] = useState<Msg>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Section mot de passe
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<Msg>(null);

  // Section email
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<Msg>(null);

  // Section suppression
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // beforeunload si modifs non sauvegardées
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function updateP<K extends keyof typeof p>(k: K, v: (typeof p)[K]) {
    setP({ ...p, [k]: v });
    setDirty(true);
    if (msg?.ok) setMsg(null);
  }

  function updateS<K extends keyof typeof s>(k: K, v: (typeof s)[K]) {
    setS({ ...s, [k]: v });
    setDirty(true);
    if (msg?.ok) setMsg(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setMsg(null);
    setSaving(true);

    if (p.timezone && !/^[A-Za-z]+\/[A-Za-z_]+$|^UTC$/.test(p.timezone)) {
      setSaving(false);
      setMsg({ ok: false, t: "Fuseau horaire invalide." });
      return;
    }

    // 1. Update profile
    const { error: r1 } = await supabase.from("profiles").update(p).eq("id", profile.id);
    if (r1) {
      setSaving(false);
      setMsg({
        ok: false,
        t:
          r1.code === "23505"
            ? "Ce pseudonyme est déjà pris."
            : r1.message,
      });
      return;
    }

    // 2. Upsert user_settings (crée la ligne si absente)
    const { error: r2 } = await supabase
      .from("user_settings")
      .upsert({ user_id: profile.id, ...s }, { onConflict: "user_id" });

    if (r2) {
      setSaving(false);
      setMsg({ ok: false, t: r2.message });
      return;
    }

    setSaving(false);
    setDirty(false);
    setMsg({ ok: true, t: "Profil enregistré avec succès." });
    router.refresh();

    // Auto-dismiss du succès
    setTimeout(() => setMsg((m) => (m?.ok ? null : m)), 3000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwdBusy) return;
    setPwdMsg(null);

    if (!oldPwd || !newPwd) {
      setPwdMsg({ ok: false, t: "Renseignez l'ancien et le nouveau mot de passe." });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ ok: false, t: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    if (oldPwd === newPwd) {
      setPwdMsg({ ok: false, t: "Le nouveau mot de passe doit être différent de l'ancien." });
      return;
    }

    setPwdBusy(true);

    // Vérifier l'ancien mot de passe
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: oldPwd,
    });
    if (signInErr) {
      setPwdBusy(false);
      setPwdMsg({ ok: false, t: "Ancien mot de passe incorrect." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdBusy(false);

    if (error) {
      setPwdMsg({ ok: false, t: error.message });
      return;
    }

    setOldPwd("");
    setNewPwd("");
    setPwdMsg({ ok: true, t: "Mot de passe modifié." });
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (emailBusy) return;
    setEmailMsg(null);

    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailMsg({ ok: false, t: "Entrez une adresse email valide." });
      return;
    }
    if (trimmed.toLowerCase() === userEmail.toLowerCase()) {
      setEmailMsg({ ok: false, t: "C'est déjà votre adresse actuelle." });
      return;
    }

    setEmailBusy(true);
    const { error } = await supabase.auth.updateUser(
      { email: trimmed },
      { emailRedirectTo: `${window.location.origin}/auth/callback?next=/profil` }
    );
    setEmailBusy(false);

    if (error) {
      setEmailMsg({ ok: false, t: error.message });
      return;
    }
    setNewEmail("");
    setEmailMsg({
      ok: true,
      t: "Un email de confirmation a été envoyé à la nouvelle adresse. Cliquez sur le lien pour valider le changement.",
    });
  }

  async function deleteAccount() {
    if (deleteConfirm !== "SUPPRIMER") return;
    if (
      !confirm(
        "Confirmer la suppression définitive de votre compte et de toutes vos données ? Cette action est irréversible."
      )
    ) {
      return;
    }
    setDeleteBusy(true);
    setDeleteError(null);

    const { error } = await supabase.rpc("delete_own_account");
    setDeleteBusy(false);

    if (error) {
      setDeleteError(error.message);
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const Check = ({
    k,
    label,
  }: {
    k: "leaderboard_visibility" | "email_notifications" | "notifications_enabled";
    label: string;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={s[k]}
          onChange={(e) => updateS(k, e.target.checked)}
          className="peer appearance-none w-5 h-5 border border-slate-300 rounded focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer"
        />
        <svg
          className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
          viewBox="0 0 14 10"
          fill="none"
        >
          <path
            d="M1 5L4.5 8.5L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
    </label>
  );

  return (
    <div className="space-y-8">
      {/* ===== Informations personnelles ===== */}
      <form
        onSubmit={save}
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        aria-busy={saving}
      >
        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-name" className="block text-sm font-medium text-slate-700 mb-2">
                Nom complet
              </label>
              <input
                id="pf-name"
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={p.full_name}
                onChange={(e) => updateP("full_name", e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="pf-username" className="block text-sm font-medium text-slate-700 mb-2">
                Pseudonyme (classement)
              </label>
              <input
                id="pf-username"
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={p.username}
                onChange={(e) => updateP("username", e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="pf-phone" className="block text-sm font-medium text-slate-700 mb-2">
                Téléphone
              </label>
              <input
                id="pf-phone"
                type="tel"
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={p.phone}
                onChange={(e) => updateP("phone", e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="pf-country" className="block text-sm font-medium text-slate-700 mb-2">
                Pays
              </label>
              <input
                id="pf-country"
                autoComplete="country-name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={p.country}
                onChange={(e) => updateP("country", e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="pf-tz" className="block text-sm font-medium text-slate-700 mb-2">
                Fuseau horaire (séries)
              </label>
              <select
                id="pf-tz"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={p.timezone}
                onChange={(e) => updateP("timezone", e.target.value)}
                disabled={saving}
              >
                {tzOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pf-mode" className="block text-sm font-medium text-slate-700 mb-2">
                Mode d'apprentissage par défaut
              </label>
              <select
                id="pf-mode"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={s.learning_mode_default}
                onChange={(e) =>
                  updateS(
                    "learning_mode_default",
                    e.target.value as typeof s.learning_mode_default
                  )
                }
                disabled={saving}
              >
                <option value="classic">Classique</option>
                <option value="interactive">Interactif</option>
                <option value="intensive">Intensif</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pf-avatar" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                URL de l&apos;avatar
              </label>
              <input
                id="pf-avatar"
                type="url"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={p.avatar_url}
                onChange={(e) => updateP("avatar_url", e.target.value)}
                placeholder="https://exemple.com/avatar.jpg"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label htmlFor="pf-bio" className="block text-sm font-medium text-slate-700 mb-2">
              Bio
            </label>
            <textarea
              id="pf-bio"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              rows={3}
              value={p.bio}
              onChange={(e) => updateP("bio", e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-slate-900 mb-3">Préférences</h3>
            <Check k="leaderboard_visibility" label="Apparaître dans les classements publics" />
            <Check k="notifications_enabled" label="Recevoir les notifications internes" />
            <Check k="email_notifications" label="Recevoir les notifications par email" />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            {msg && (
              <p
                role="alert"
                aria-live="polite"
                className={`text-sm font-medium flex items-center gap-1.5 ${
                  msg.ok ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {msg.ok ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {msg.t}
              </p>
            )}
            {dirty && !msg && (
              <p className="text-xs text-amber-600">Modifications non enregistrées.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>

      {/* ===== Sécurité : mot de passe ===== */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Changer de mot de passe</h2>
        </div>
        <form onSubmit={changePassword} className="p-6 space-y-4" aria-busy={pwdBusy}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pwd-old" className="block text-sm font-medium text-slate-700 mb-2">
                Ancien mot de passe
              </label>
              <input
                id="pwd-old"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
                disabled={pwdBusy}
              />
            </div>
            <div>
              <label htmlFor="pwd-new" className="block text-sm font-medium text-slate-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="pwd-new"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full rounded-lg border border-slate-300 px-3 pr-10 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  disabled={pwdBusy}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPwd ? "Masquer" : "Afficher"}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              {pwdMsg && (
                <p
                  role="alert"
                  className={`text-sm ${
                    pwdMsg.ok ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {pwdMsg.t}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pwdBusy || !oldPwd || !newPwd}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pwdBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Modifier le mot de passe
            </button>
          </div>
        </form>
      </section>

      {/* ===== Sécurité : email ===== */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Changer d&apos;email</h2>
        </div>
        <form onSubmit={changeEmail} className="p-6 space-y-4" aria-busy={emailBusy}>
          <p className="text-sm text-slate-500">
            Adresse actuelle : <span className="font-medium text-slate-900 break-all">{userEmail}</span>
          </p>
          <div>
            <label htmlFor="email-new" className="block text-sm font-medium text-slate-700 mb-2">
              Nouvelle adresse email
            </label>
            <input
              id="email-new"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nouvelle@exemple.com"
              disabled={emailBusy}
            />
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              {emailMsg && (
                <p
                  role="alert"
                  className={`text-sm ${
                    emailMsg.ok ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {emailMsg.t}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={emailBusy || !newEmail.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {emailBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Envoyer la confirmation
            </button>
          </div>
        </form>
      </section>

      {/* ===== Zone dangereuse : suppression de compte (RGPD) ===== */}
      <section className="rounded-xl border border-red-200 bg-red-50/40 shadow-sm overflow-hidden">
        <div className="border-b border-red-200 bg-red-50 px-6 py-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          <h2 className="font-semibold text-red-900">Supprimer mon compte</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-red-800">
            Cette action supprimera définitivement votre compte, vos inscriptions, votre
            progression et l&apos;ensemble de vos données personnelles. Elle est{" "}
            <strong>irréversible</strong>.
          </p>
          <div>
            <label htmlFor="delete-confirm" className="block text-sm font-medium text-red-900 mb-2">
              Tapez <code className="px-1 rounded bg-red-100">SUPPRIMER</code> pour confirmer
            </label>
            <input
              id="delete-confirm"
              type="text"
              className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 bg-white"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              disabled={deleteBusy}
            />
          </div>
          {deleteError && (
            <p role="alert" className="text-sm text-red-700">
              {deleteError}
            </p>
          )}
          <button
            type="button"
            onClick={deleteAccount}
            disabled={deleteConfirm !== "SUPPRIMER" || deleteBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {deleteBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Supprimer définitivement mon compte
          </button>
        </div>
      </section>
    </div>
  );
}