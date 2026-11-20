"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

export default function FormationEditor({ formation, modules, lessons, activities }: { formation: any; modules: any[]; lessons: any[]; activities: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [f, setF] = useState({
    title: formation.title, description: formation.description ?? "", category: formation.category ?? "", price: String(formation.price),
    difficulty: formation.difficulty, duration_days: String(formation.duration_days ?? ""), allow_partial_access: formation.allow_partial_access,
    objectives: (formation.objectives ?? []).join("\n"),
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [newModule, setNewModule] = useState("");
  const refresh = () => router.refresh();

  async function save() {
    const { error } = await supabase.from("formations").update({
      title: f.title, description: f.description, category: f.category, price: Number(f.price), difficulty: f.difficulty,
      duration_days: f.duration_days ? Number(f.duration_days) : null, allow_partial_access: f.allow_partial_access,
      objectives: f.objectives.split("\n").map((s: string) => s.trim()).filter(Boolean),
    }).eq("id", formation.id);
    setMsg(error ? error.message : "Enregistré."); refresh();
  }
  async function setStatus(status: string) {
    const { error } = await supabase.from("formations").update({ status, published_at: status === "published" ? new Date().toISOString() : formation.published_at }).eq("id", formation.id);
    setMsg(error ? error.message : `Statut : ${status}`); refresh();
  }
  async function addModule() {
    if (!newModule.trim()) return;
    await supabase.from("formation_modules").insert({ formation_id: formation.id, title: newModule, position: modules.length + 1 });
    setNewModule(""); refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const a = modules[i], b = modules[i + dir]; if (!b) return;
    await supabase.from("formation_modules").update({ position: b.position }).eq("id", a.id);
    await supabase.from("formation_modules").update({ position: a.position }).eq("id", b.id);
    refresh();
  }
  async function delModule(id: string) { if (confirm("Supprimer ce module et ses leçons ?")) { await supabase.from("formation_modules").delete().eq("id", id); refresh(); } }
  async function addLesson(moduleId: string) {
    const title = prompt("Titre de la leçon"); if (!title) return;
    const { data: { user } } = await supabase.auth.getUser();
    const n = lessons.filter((l) => l.module_id === moduleId).length + 1;
    const { data, error } = await supabase.from("lessons").insert({ module_id: moduleId, title, slug: slugify(title) || `lecon-${n}`, position: n, content: [], created_by: user?.id }).select("id").single();
    if (error) alert(error.message); else router.push(`/admin/lessons/${data.id}`);
  }
  async function addActivity(moduleId: string) {
    const title = prompt("Titre de l'activité (quiz)"); if (!title) return;
    const { data, error } = await supabase.from("activities").insert({ formation_id: formation.id, module_id: moduleId, title, type: "quiz", configuration: { passing_score: 70, shuffle_answers: true } }).select("id").single();
    if (error) alert(error.message); else router.push(`/admin/activities/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-brand-900">{formation.title}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="chip">{formation.status}</span>
          {formation.status !== "published" ? <button className="btn btn-primary btn-sm" onClick={() => setStatus("published")}>Publier</button> : <button className="btn btn-secondary btn-sm" onClick={() => setStatus("draft")}>Dépublier</button>}
          <button className="btn btn-secondary btn-sm" onClick={() => setStatus("archived")}>Archiver</button>
        </div>
      </div>
      <section className="card space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Titre</label><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><label className="label">Catégorie</label><input className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
          <div><label className="label">Prix (FCFA)</label><input className="input" type="number" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div><label className="label">Niveau</label><select className="input" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}><option value="beginner">Débutant</option><option value="intermediate">Intermédiaire</option><option value="advanced">Avancé</option></select></div>
          <div><label className="label">Durée (jours)</label><input className="input" type="number" value={f.duration_days} onChange={(e) => setF({ ...f, duration_days: e.target.value })} /></div>
        </div>
        <div><label className="label">Description</label><textarea className="input" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div><label className="label">Objectifs (un par ligne)</label><textarea className="input" rows={4} value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allow_partial_access} onChange={(e) => setF({ ...f, allow_partial_access: e.target.checked })} />Accès dès le premier versement (paiement fractionné)</label>
        <button className="btn btn-primary" onClick={save}>Enregistrer</button>{msg && <span className="ml-3 text-sm text-slate-600">{msg}</span>}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-900">Modules & leçons</h2>
        {modules.map((m, i) => (
          <div key={m.id} className="card space-y-2">
            <div className="flex items-center justify-between gap-2">
              <b>{i + 1}. {m.title}</b>
              <div className="flex gap-1"><button className="btn btn-secondary btn-sm" onClick={() => move(i, -1)}>↑</button><button className="btn btn-secondary btn-sm" onClick={() => move(i, 1)}>↓</button><button className="btn btn-danger btn-sm" onClick={() => delModule(m.id)}>Suppr.</button></div>
            </div>
            <ul className="space-y-1 text-sm">
              {lessons.filter((l) => l.module_id === m.id).map((l) => <li key={l.id}><Link className="text-brand-700 underline" href={`/admin/lessons/${l.id}`}>📖 {l.title}</Link> <span className="chip">{l.status}</span></li>)}
              {activities.filter((a) => a.module_id === m.id && !a.lesson_id).map((a) => <li key={a.id}><Link className="text-accent-700 underline" href={`/admin/activities/${a.id}`}>🎯 {a.title}</Link> <span className="chip">{a.status}</span></li>)}
            </ul>
            <div className="flex gap-2"><button className="btn btn-secondary btn-sm" onClick={() => addLesson(m.id)}>+ Leçon</button><button className="btn btn-secondary btn-sm" onClick={() => addActivity(m.id)}>+ Quiz du module</button></div>
          </div>
        ))}
        <div className="flex gap-2"><input className="input" placeholder="Titre du nouveau module" value={newModule} onChange={(e) => setNewModule(e.target.value)} /><button className="btn btn-primary" onClick={addModule}>Ajouter</button></div>
      </section>
    </div>
  );
}
