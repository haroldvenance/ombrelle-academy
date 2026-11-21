"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null); 
  const [info, setInfo] = useState<string | null>(null); 
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setBusy(true); 
    setError(null);
    
    const { data, error } = await createClient().auth.signUp({
      email: f.email, 
      password: f.password,
      options: { 
        data: { full_name: f.name }, 
        emailRedirectTo: `${window.location.origin}/auth/callback` 
      },
    });
    
    setBusy(false);
    
    if (error) { 
      setError(error.message); 
      return; 
    }
    
    if (data.session) { 
      router.push("/dashboard"); 
      router.refresh(); 
    } else {
      setInfo("Compte créé avec succès. Un email de confirmation vous a été envoyé.");
    }
  }

  if (info) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Vérifiez votre boîte mail</h2>
          <p className="text-sm text-slate-600 mt-2">{info}</p>
        </div>
        <Link href="/connexion" className="w-full inline-flex justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Créer un compte</h1>
        <p className="text-sm text-slate-500 mt-1">Rejoignez OMBRELLE Academy et commencez à apprendre.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors" 
              required 
              placeholder="Jean Dupont"
              value={f.name} 
              onChange={(e) => setF({ ...f, name: e.target.value })} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors" 
              type="email" 
              required 
              placeholder="vous@exemple.com"
              value={f.email} 
              onChange={(e) => setF({ ...f, email: e.target.value })} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors" 
              type="password" 
              minLength={8} 
              required 
              placeholder="8 caractères minimum"
              value={f.password} 
              onChange={(e) => setF({ ...f, password: e.target.value })} 
            />
          </div>
        </div>
      </div>

      <button 
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors" 
        disabled={busy}
      >
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</> : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Déjà inscrit ? <Link className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors" href="/connexion">Se connecter</Link>
      </p>
    </form>
  );
}