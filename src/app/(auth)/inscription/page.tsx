"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Mail, Lock, User, Loader2, AlertCircle, CheckCircle2,
  Eye, EyeOff, RotateCcw, KeyRound,
} from "lucide-react";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

function mapError(message: string, status?: number): string {
  const m = message.toLowerCase();
  if (status === 429 || m.includes("rate limit")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (m.includes("already registered") || m.includes("already exists") || m.includes("user already")) return "Cet email est déjà utilisé. Essayez de vous connecter.";
  if (m.includes("invalid email")) return "Format d'email invalide.";
  if (m.includes("password")) return "Le mot de passe ne respecte pas les critères de sécurité.";
  return message;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; theme?: string; }) => string;
      remove: (id: string) => void;
    };
  }
}

export default function Register() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const strength = useMemo(() => passwordScore(f.password), [f.password]);

  // Redirection si déjà connecté
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/dashboard");
    }).catch(() => {});
  }, [router]);

  // Cooldown pour le renvoi d'email
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Charge Turnstile si la clé est définie
  useEffect(() => {
    if (!TURNSTILE_KEY || showOtpStep) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      const el = document.getElementById("turnstile-widget");
      if (el && window.turnstile) {
        window.turnstile.render(el, {
          sitekey: TURNSTILE_KEY,
          theme: "light",
          callback: (token) => setCaptchaToken(token),
        });
      }
    };
    return () => { script.remove(); };
  }, [showOtpStep]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!acceptTerms) { setError("Vous devez accepter les conditions générales."); return; }
    if (f.password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (TURNSTILE_KEY && !captchaToken) { setError("Veuillez compléter la vérification de sécurité."); return; }

    setBusy(true);

    const { data, error } = await createClient().auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        data: { full_name: f.name.trim() },
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
    setBusy(false);

    if (error) { setError(mapError(error.message, error.status)); return; }

    if (data.session) {
      window.location.href = "/dashboard";
    } else {
      setShowOtpStep(true);
      setCooldown(60);
    }
  }

  async function verifySignupOtp(e: React.FormEvent) {
    e.preventDefault();
    if (busy || otpCode.length < 6) return;

    setBusy(true);
    setError(null);

    const { error } = await createClient().auth.verifyOtp({
      email: f.email.trim(),
      token: otpCode.trim(),
      type: "signup", // <--- CRUCIAL ICI
    });

    setBusy(false);

    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("expired")) {
        setError("Ce code a expiré. Cliquez sur « Renvoyer le code ».");
      } else if (m.includes("invalid") || m.includes("token") || m.includes("otp")) {
        setError("Code incorrect. Vérifiez les 6 chiffres reçus par email.");
      } else {
        setError(error.message);
      }
      return;
    }

    window.location.href = "/dashboard";
  }

  async function resend() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError(null);

    const { error } = await createClient().auth.resend({
      type: "signup",
      email: f.email.trim(),
    });

    setResending(false);
    if (error) {
      if (error.status === 429) { setError("Trop de renvois. Réessayez dans une minute."); setCooldown(60); } 
      else { setError(mapError(error.message, error.status)); }
      return;
    }
    setCooldown(60);
  }

  if (showOtpStep) {
    return (
      <form onSubmit={verifySignupOtp} className="space-y-6" aria-busy={busy}>
        <div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 mb-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Vérifiez votre email</h1>
          <p className="text-sm text-slate-500 mt-1">
            Un code à 6 chiffres a été envoyé à <strong>{f.email}</strong>.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="signup-otp" className="block text-sm font-medium text-slate-700 mb-1">Code de vérification</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="signup-otp"
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-3 text-lg font-mono tracking-[0.4em] text-center focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              required
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={busy}
              autoFocus
            />
          </div>
        </div>

        <button type="submit" disabled={busy || otpCode.length < 6} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Vérification...</> : "Valider mon compte"}
        </button>

        <div className="flex items-center justify-between gap-2 pt-2 text-sm">
          <button type="button" onClick={() => { setShowOtpStep(false); setOtpCode(""); setError(null); }} className="text-slate-500 hover:text-slate-800" disabled={busy}>
            Modifier l'adresse email
          </button>
          <button type="button" onClick={resend} disabled={resending || cooldown > 0 || busy} className="text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1 disabled:opacity-50">
            {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer le code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6" aria-busy={busy}>
      {/* ... Reste du formulaire d'inscription (inchangé) ... */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Créer un compte</h1>
        <p className="text-sm text-slate-500 mt-1">Rejoignez OMBRELLE Academy et commencez à apprendre.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input id="reg-name" className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600" autoComplete="name" required placeholder="Jean Dupont" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} disabled={busy} />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input id="reg-email" className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600" type="email" autoComplete="email" required placeholder="vous@exemple.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} disabled={busy} />
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input id="reg-password" className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600" type={showPwd ? "text" : "password"} autoComplete="new-password" minLength={8} required placeholder="8 caractères minimum" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} disabled={busy} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {f.password && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded ${i < strength.score ? strength.color : "bg-slate-200"}`} />)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Force : {strength.label}</p>
            </div>
          )}
        </div>
      </div>

      {TURNSTILE_KEY && <div id="turnstile-widget" className="flex justify-center" />}

      <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" required />
        <span>J&apos;accepte les <Link href="/cgu" className="text-indigo-600 underline" target="_blank">conditions générales</Link> et la <Link href="/confidentialite" className="text-indigo-600 underline" target="_blank">politique de confidentialité</Link>.</span>
      </label>

      <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors" disabled={busy || !acceptTerms}>
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</> : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Déjà inscrit ? <Link className="font-medium text-indigo-600 hover:text-indigo-500" href="/connexion">Se connecter</Link>
      </p>
    </form>
  );
}