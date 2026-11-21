"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginForm({ next, error: initial }: { next: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initial ? "Une erreur d'authentification est survenue." : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setBusy(true); 
    setError(null);
    
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    
    if (error) { 
      setError("Email ou mot de passe incorrect."); 
      return; 
    }
    
    router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"); 
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Connexion</h1>
        <p className="text-sm text-slate-500 mt-1">Accédez à votre espace d'apprentissage.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
            <Link className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors" href="/mot-de-passe-oublie">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors" 
              type="password" 
              required 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <button 
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors" 
        disabled={busy}
      >
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Connexion...</> : "Se connecter"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Nouveau sur la plateforme ? <Link className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors" href="/inscription">Créer un compte</Link>
      </p>
    </form>
  );
}