"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Loader2, AlertCircle } from "lucide-react";

export default function Reset() {
  const router = useRouter();
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    
    const { error } = await createClient().auth.updateUser({ password });
    
    setBusy(false);
    if (error) setError(error.message); 
    else { 
      router.push("/dashboard"); 
      router.refresh(); 
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Nouveau mot de passe</h1>
        <p className="text-sm text-slate-500 mt-1">Définissez un nouveau mot de passe sécurisé pour votre compte.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors" 
            type="password" 
            minLength={8} 
            required 
            placeholder="8 caractères minimum"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
      </div>

      <button 
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}