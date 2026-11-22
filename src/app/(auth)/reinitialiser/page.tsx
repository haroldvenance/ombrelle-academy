"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";

function passwordScore(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) s++;
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  const label = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"][score];
  const color = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"][score];
  return { score, label, color };
}

export default function Reset() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  const strength = useMemo(() => passwordScore(password), [password]);

  useEffect(() => {
    let active = true;
    // Le verifyOtp de l'étape précédente a créé une session. On la vérifie ici.
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        router.replace("/mot-de-passe-oublie?expired=1");
        return;
      }
      setChecking(false);
    }).catch(() => {
      if (active) router.replace("/mot-de-passe-oublie?expired=1");
    });
    return () => { active = false; };
  }, [router, supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      setBusy(false);
      const m = error.message.toLowerCase();
      if (m.includes("same") || m.includes("should be different")) { setError("Le nouveau mot de passe doit être différent de l'ancien."); } 
      else if (m.includes("weak") || m.includes("password")) { setError("Mot de passe trop faible. Utilisez au moins 8 caractères avec des majuscules, chiffres et symboles."); } 
      else { setError(error.message); }
      return;
    }

    await supabase.auth.signOut({ scope: "others" });

    setBusy(false);
    window.location.href = "/dashboard";
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Vérification de la session...
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6" aria-busy={busy}>
      <div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 mb-3">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Nouveau mot de passe</h1>
        <p className="text-sm text-slate-500 mt-1">Définissez un nouveau mot de passe sécurisé pour votre compte.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input id="reset-password" className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600" type={showPwd ? "text" : "password"} autoComplete="new-password" minLength={8} required placeholder="8 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? "Masquer" : "Afficher"} tabIndex={-1}>
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded ${i < strength.score ? strength.color : "bg-slate-200"}`} />)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Force : {strength.label}</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="reset-confirm" className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input id="reset-confirm" className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600" type={showPwd ? "text" : "password"} autoComplete="new-password" minLength={8} required placeholder="Répétez le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={busy} aria-invalid={confirm.length > 0 && confirm !== password} />
          </div>
          {confirm.length > 0 && confirm !== password && (
            <p className="text-xs text-red-600 mt-1" role="alert">Les mots de passe ne correspondent pas.</p>
          )}
          {confirm.length > 0 && confirm === password && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Les mots de passe correspondent.</p>
          )}
        </div>
      </div>

      <button type="submit" disabled={busy || password.length < 8 || password !== confirm} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : "Enregistrer le mot de passe"}
      </button>

      <p className="text-xs text-slate-500 text-center">Pour votre sécurité, toutes vos autres sessions seront déconnectées après le changement.</p>
    </form>
  );
}