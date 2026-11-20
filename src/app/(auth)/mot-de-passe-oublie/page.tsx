"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Forgot() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reinitialiser` });
    if (error) setError(error.message); else setSent(true);
  }
  if (sent) return <p className="text-emerald-700">Si un compte existe pour cet email, un lien de réinitialisation vient d&apos;être envoyé.</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold text-brand-900">Mot de passe oublié</h1>
      <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full">Envoyer le lien</button>
    </form>
  );
}
