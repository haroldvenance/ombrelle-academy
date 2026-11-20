"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Reset() {
  const router = useRouter();
  const [password, setPassword] = useState(""); const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().auth.updateUser({ password });
    if (error) setError(error.message); else { router.push("/dashboard"); router.refresh(); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold text-brand-900">Nouveau mot de passe</h1>
      <input className="input" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full">Enregistrer</button>
    </form>
  );
}
