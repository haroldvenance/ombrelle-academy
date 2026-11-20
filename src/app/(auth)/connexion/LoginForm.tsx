"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next, error: initial }: { next: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initial ? "Une erreur est survenue, réessaie." : null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError("Email ou mot de passe incorrect."); return; }
    router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold text-brand-900">Connexion</h1>
      <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><label className="label">Mot de passe</label><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "…" : "Se connecter"}</button>
      <div className="flex justify-between text-sm"><Link className="text-brand-700 underline" href="/mot-de-passe-oublie">Mot de passe oublié ?</Link><Link className="text-brand-700 underline" href="/inscription">Créer un compte</Link></div>
    </form>
  );
}
