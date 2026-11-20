"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

export default function NewFormation() {
  const router = useRouter();
  const [f, setF] = useState({ title: "", category: "Finance", price: "0", difficulty: "beginner", duration_days: "14", description: "" });
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("formations").insert({
      title: f.title, slug: slugify(f.title), category: f.category, price: Number(f.price), difficulty: f.difficulty,
      duration_days: Number(f.duration_days), description: f.description, created_by: user?.id,
    }).select("id").single();
    if (error) setError(error.message); else router.push(`/admin/formations/${data.id}`);
  }
  return (
    <form onSubmit={submit} className="card max-w-xl space-y-3">
      <h1 className="text-xl font-bold">Nouvelle formation</h1>
      <div><label className="label">Titre</label><input className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Catégorie</label><input className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
        <div><label className="label">Prix (FCFA)</label><input className="input" type="number" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
        <div><label className="label">Niveau</label><select className="input" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}><option value="beginner">Débutant</option><option value="intermediate">Intermédiaire</option><option value="advanced">Avancé</option></select></div>
        <div><label className="label">Durée (jours)</label><input className="input" type="number" min="1" value={f.duration_days} onChange={(e) => setF({ ...f, duration_days: e.target.value })} /></div>
      </div>
      <div><label className="label">Description</label><textarea className="input" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary">Créer</button>
    </form>
  );
}
