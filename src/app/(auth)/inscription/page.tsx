"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Register() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null); const [info, setInfo] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const { data, error } = await createClient().auth.signUp({
      email: f.email, password: f.password,
      options: { data: { full_name: f.name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (data.session) { router.push("/dashboard"); router.refresh(); } else setInfo("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.");
  }
  if (info) return <div className="space-y-3"><p className="text-emerald-700">{info}</p><Link href="/connexion" className="btn btn-primary w-full">Aller à la connexion</Link></div>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold text-brand-900">Créer un compte</h1>
      <div><label className="label">Nom complet</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><label className="label">Mot de passe (8 caractères min.)</label><input className="input" type="password" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "…" : "Créer mon compte"}</button>
      <p className="text-center text-sm">Déjà inscrit ? <Link className="text-brand-700 underline" href="/connexion">Connexion</Link></p>
    </form>
  );
}
