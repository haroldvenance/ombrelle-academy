"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BlockRenderer from "@/components/BlockRenderer";
import type { Block } from "@/types";
import {
  ArrowLeft, ArrowUp, ArrowDown, X, Plus, Save, Eye, EyeOff,
  Target, CheckCircle2, AlertCircle,
} from "lucide-react";

const TYPES: [Block["type"], string][] = [
  ["heading", "Titre"],
  ["text", "Texte"],
  ["definition", "Définition"],
  ["example", "Exemple"],
  ["warning", "Attention"],
  ["summary", "Résumé"],
  ["quote", "Citation"],
  ["question", "Question de réflexion"],
  ["list", "Liste"],
  ["table", "Tableau"],
  ["image", "Image (URL)"],
];

export default function LessonEditor({ lesson, activities }: { lesson: any; activities: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [meta, setMeta] = useState({
    title: lesson.title,
    description: lesson.description ?? "",
    xp_reward: String(lesson.xp_reward),
    estimated_duration: String(lesson.estimated_duration ?? ""),
  });
  const [blocks, setBlocks] = useState<Block[]>(lesson.content ?? []);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [activityTitle, setActivityTitle] = useState<string | null>(null);

  const upd = (i: number, patch: Partial<Block>) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i: number, d: -1 | 1) => {
    const n = [...blocks];
    const t = n[i + d];
    if (!t) return;
    n[i + d] = n[i];
    n[i] = t;
    setBlocks(n);
  };
  const add = (type: Block["type"]) =>
    setBlocks([
      ...blocks,
      type === "list"
        ? { type, items: [""] }
        : type === "table"
        ? { type, headers: ["Col 1", "Col 2"], rows: [["", ""]] }
        : { type, text: "" },
    ]);

  async function save(status?: string) {
    const published = (status ?? lesson.status) === "published";
    const { error } = await supabase
      .from("lessons")
      .update({
        title: meta.title,
        description: meta.description,
        xp_reward: Number(meta.xp_reward),
        estimated_duration: meta.estimated_duration ? Number(meta.estimated_duration) : null,
        content: blocks,
        ...(status ? { status, published_at: status === "published" ? new Date().toISOString() : lesson.published_at } : {}),
        ...(published ? { version: lesson.version + 1 } : {}),
      })
      .eq("id", lesson.id);
    setMsg({ ok: !error, text: error ? error.message : "Modifications enregistrées." });
    router.refresh();
  }

  async function createActivity() {
    if (!activityTitle?.trim()) return;
    const { data: mod } = await supabase.from("formation_modules").select("formation_id").eq("id", lesson.module_id).single();
    const { data, error } = await supabase
      .from("activities")
      .insert({
        formation_id: mod!.formation_id,
        module_id: lesson.module_id,
        lesson_id: lesson.id,
        title: activityTitle.trim(),
        type: "quiz",
        configuration: { passing_score: 70, shuffle_answers: true },
      })
      .select("id")
      .single();
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setActivityTitle(null);
    router.push(`/admin/activities/${data.id}`);
  }

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900" href={`/admin/formations/${lesson.formation_modules.formation_id}`}>
        <ArrowLeft className="h-4 w-4" /> Retour à la formation
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-900">
          Éditer la leçon
          <span className="chip">{lesson.status} · v{lesson.version}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setPreview(!preview)}>
            {preview ? <><EyeOff className="h-4 w-4" /> Éditer</> : <><Eye className="h-4 w-4" /> Prévisualiser</>}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => save()}>
            <Save className="h-4 w-4" /> Enregistrer
          </button>
          {lesson.status === "published" ? (
            <button className="btn btn-secondary btn-sm" onClick={() => save("draft")}>
              <EyeOff className="h-4 w-4" /> Dépublier
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => save("published")}>
              <Eye className="h-4 w-4" /> Publier
            </button>
          )}
        </div>
      </div>

      {msg && (
        <p className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {msg.text}
        </p>
      )}

      <div className="card grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="label">Titre</label>
          <input className="input" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Description</label>
          <input className="input" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
        </div>
        <div>
          <label className="label">XP</label>
          <input className="input" type="number" min="0" value={meta.xp_reward} onChange={(e) => setMeta({ ...meta, xp_reward: e.target.value })} />
        </div>
        <div>
          <label className="label">Durée (min)</label>
          <input className="input" type="number" value={meta.estimated_duration} onChange={(e) => setMeta({ ...meta, estimated_duration: e.target.value })} />
        </div>
      </div>

      {preview ? (
        <div className="card">
          <BlockRenderer blocks={blocks} />
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((b, i) => (
            <div key={i} className="card space-y-2 !p-4">
              <div className="flex items-center justify-between">
                <span className="chip chip-violet">{TYPES.find((t) => t[0] === b.type)?.[1] ?? b.type}</span>
                <div className="flex gap-1">
                  <button className="btn btn-secondary btn-sm" onClick={() => move(i, -1)} title="Monter">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => move(i, 1)} title="Descendre">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} title="Supprimer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {b.type === "list" ? (
                <textarea className="input" rows={4} placeholder="Un élément par ligne" value={(b.items ?? []).join("\n")} onChange={(e) => upd(i, { items: e.target.value.split("\n") })} />
              ) : b.type === "table" ? (
                <textarea
                  className="input font-mono text-xs"
                  rows={5}
                  placeholder={"En-têtes séparés par |\nLignes séparées par |"}
                  value={[(b.headers ?? []).join(" | "), ...(b.rows ?? []).map((r) => r.join(" | "))].join("\n")}
                  onChange={(e) => {
                    const [h, ...rs] = e.target.value.split("\n");
                    upd(i, { headers: h.split("|").map((x) => x.trim()), rows: rs.map((r) => r.split("|").map((x) => x.trim())) });
                  }}
                />
              ) : b.type === "image" ? (
                <>
                  <input className="input" placeholder="URL de l'image" value={b.url ?? ""} onChange={(e) => upd(i, { url: e.target.value })} />
                  <input className="input" placeholder="Légende" value={b.caption ?? ""} onChange={(e) => upd(i, { caption: e.target.value })} />
                </>
              ) : (
                <textarea className="input" rows={b.type === "heading" ? 1 : 3} value={b.text ?? ""} onChange={(e) => upd(i, { text: e.target.value })} />
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {TYPES.map(([t, l]) => (
              <button key={t} className="btn btn-secondary btn-sm" onClick={() => add(t)}>
                <Plus className="h-3.5 w-3.5" /> {l}
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="card space-y-3">
        <h2 className="font-bold text-slate-900">Activités de la leçon</h2>
        {activities.length === 0 && <p className="text-sm text-slate-500">Aucune activité attachée à cette leçon.</p>}
        <ul className="space-y-1.5 text-sm">
          {activities.map((a) => (
            <li key={a.id} className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent-600" />
              <Link className="font-medium text-accent-700 hover:underline" href={`/admin/activities/${a.id}`}>{a.title}</Link>
              <span className="chip">{a.status}</span>
            </li>
          ))}
        </ul>
        {activityTitle !== null ? (
          <div className="flex flex-wrap gap-2">
            <input
              className="input flex-1"
              placeholder="Titre du quiz"
              autoFocus
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createActivity(); }}
            />
            <button className="btn btn-primary btn-sm" onClick={createActivity}>
              <Plus className="h-3.5 w-3.5" /> Créer
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivityTitle(null)}>Annuler</button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => setActivityTitle("")}>
            <Plus className="h-3.5 w-3.5" /> Quiz
          </button>
        )}
      </section>
    </div>
  );
}