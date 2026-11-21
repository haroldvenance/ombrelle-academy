"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function Forgot() {
  const [email, setEmail] = useState(""); 
  const [sent, setSent] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    
    const { error } = await createClient().auth.resetPasswordForEmail(email, { 
      redirectTo: `${window.location.origin}/auth/callback?next=/reinitialiser` 
    });
    
    setBusy(false);
    if (error) setError(error.message); 
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Email envoyé</h2>
          <p className="text-sm text-slate-600 mt-2">
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient d'être envoyé.
          </p>
        </div>
        <Link href="/connexion" className="w-full inline-flex justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <Link href="/connexion" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Mot de passe oublié</h1>
        <p className="text-sm text-slate-500 mt-1">Entrez votre email pour recevoir un lien de réinitialisation.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors" 
            type="email" 
            required 
            placeholder="vous@exemple.com"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
      </div>

      <button 
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : "Envoyer le lien de réinitialisation"}
      </button>
    </form>
  );
}