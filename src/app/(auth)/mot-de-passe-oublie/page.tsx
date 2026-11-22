"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, AlertCircle, ArrowLeft, KeyRound, RotateCcw } from "lucide-react";

type Step = "email" | "code";

export default function Forgot() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/dashboard");
    }).catch(() => {});
  }, [router, supabase]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy || cooldown > 0 || !email.trim()) return;

    setBusy(true);
    setError(null);

    // 1. Demande l'envoi du code OTP
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    setBusy(false);
    if (error) {
      if (error.status === 429) { setError("Trop de demandes. Réessayez dans une minute."); setCooldown(60); } 
      else { setError(error.message); }
      return;
    }

    setStep("code");
    setCooldown(60);
  }

  async function resend() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setResending(false);

    if (error) {
      if (error.status === 429) { setError("Trop de demandes. Réessayez dans une minute."); setCooldown(60); } 
      else { setError(error.message); }
      return;
    }
    setCooldown(60);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy || code.trim().length < 6) return;

    setBusy(true);
    setError(null);

    // 2. Vérifie le code avec le type 'recovery'
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery", // <--- CRUCIAL ICI
    });

    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("expired")) { setError("Ce code a expiré. Cliquez sur « Renvoyer un code »."); } 
      else if (m.includes("invalid") || m.includes("token") || m.includes("otp")) { setError("Code incorrect. Vérifiez les 6 chiffres reçus par email."); } 
      else { setError(error.message); }
      return;
    }

    router.push("/reinitialiser");
    router.refresh();
  }

  return (
    <form onSubmit={step === "email" ? sendCode : verifyCode} className="space-y-6" aria-busy={busy}>
      <div>
        <Link href="/connexion" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Mot de passe oublié</h1>
        <p className="text-sm text-slate-500 mt-1">
          {step === "email" ? "Entrez votre email pour recevoir un code." : "Saisissez le code à 6 chiffres reçu par email."}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {step === "email" ? (
        <>
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input id="forgot-email" className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600" type="email" autoComplete="email" required placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} autoFocus />
            </div>
          </div>
          <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : "Recevoir le code"}
          </button>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="forgot-code" className="block text-sm font-medium text-slate-700 mb-1">Code de vérification</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input id="forgot-code" className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-3 text-lg font-mono tracking-[0.4em] text-center focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" required placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} disabled={busy} autoFocus />
            </div>
          </div>
          <button type="submit" disabled={busy || code.length < 6} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Vérification...</> : "Vérifier le code"}
          </button>
          <div className="flex items-center justify-between gap-2 pt-2 text-sm">
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }} className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1" disabled={busy}>
              <ArrowLeft className="h-3.5 w-3.5" /> Changer d'email
            </button>
            <button type="button" onClick={resend} disabled={resending || cooldown > 0 || busy} className="text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1 disabled:opacity-50">
              {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer un code"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}