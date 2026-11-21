"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Formation, Difficulty } from "@/types";
import {
  BookOpen,
  Target,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Archive,
  RotateCcw,
  Image as ImageIcon,
  Loader2,
  Link2,
} from "lucide-react";

type ModuleRow = {
  id: string;
  title: string;
  position: number;
};

type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  position: number;
  status: string;
};

type ActivityRow = {
  id: string;
  module_id: string | null;
  lesson_id: string | null;
  title: string;
  status: string;
};

type EditorState = {
  title: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  difficulty: Difficulty;
  duration_days: string;
  cover_url: string;
  allow_partial_access: boolean;
  objectives: string;
};

export default function FormationEditor({
  formation,
  modules,
  lessons,
  activities,
}: {
  formation: Formation;
  modules: ModuleRow[];
  lessons: LessonRow[];
  activities: ActivityRow[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [f, setF] = useState<EditorState>({
    title: formation.title,
    slug: formation.slug ?? "",
    description: formation.description ?? "",
    category: formation.category ?? "",
    price: String(formation.price ?? 0),
    difficulty: (formation.difficulty ?? "beginner") as Difficulty,
    duration_days: String(formation.duration_days ?? ""),
    cover_url: formation.cover_url ?? "",
    allow_partial_access: !!formation.allow_partial_access,
    objectives: (formation.objectives ?? []).join("\n"),
  });

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [newModule, setNewModule] = useState("");

  const [lessonInput, setLessonInput] = useState<{ moduleId: string; title: string } | null>(null);
  const [activityInput, setActivityInput] = useState<{ moduleId: string; title: string } | null>(null);

  const refresh = () => router.refresh();
  const isBusy = (key: string) => busy === key;

  // Index précalculés pour éviter les O(n×m) à chaque render
  const lessonsByModule = useMemo(() => {
    const map: Record<string, LessonRow[]> = {};
    for (const l of lessons) (map[l.module_id] ??= []).push(l);
    return map;
  }, [lessons]);

  const activitiesByModule = useMemo(() => {
    const map: Record<string, ActivityRow[]> = {};
    for (const a of activities) {
      if (!a.lesson_id && a.module_id) (map[a.module_id] ??= []).push(a);
    }
    return map;
  }, [activities]);

  async function save() {
    if (busy) return;
    setBusy("save");
    setMsg(null);

    const price = Math.max(0, Number(f.price) || 0);
    const duration = f.duration_days ? Math.max(1, Number(f.duration_days)) : null;
    const slug = (f.slug || slugify(f.title) || `formation-${Date.now()}`).toLowerCase();

    const { error } = await supabase
      .from("formations")
      .update({
        title: f.title.trim(),
        slug,
        description: f.description,
        category: f.category,
        price,
        difficulty: f.difficulty,
        duration_days: duration,
        cover_url: f.cover_url.trim() || null,
        allow_partial_access: f.allow_partial_access,
        objectives: f.objectives
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean),
      })
      .eq("id", formation.id);

    setBusy(null);
    setMsg({
      ok: !error,
      text: error ? error.message : "Modifications enregistrées.",
    });
    if (!error) refresh();
  }

  async function setStatus(status: "draft" | "published" | "archived") {
    if (busy) return;

    if (
      status === "archived" &&
      !confirm("Archiver cette formation ? Elle ne sera plus visible des étudiants.")
    ) {
      return;
    }

    setBusy("status");
    const update: Record<string, unknown> = { status };

    // published_at = date de première publication, on ne l'écrase pas
    if (status === "published" && !formation.published_at) {
      update.published_at = new Date().toISOString();
    }

    const { error } = await supabase.from("formations").update(update).eq("id", formation.id);

    setBusy(null);
    setMsg({
      ok: !error,
      text: error ? error.message : `Statut : ${status}`,
    });
    if (!error) refresh();
  }

  async function addModule() {
    if (!newModule.trim() || busy) return;
    setBusy("add-module");

    const maxPos = modules.reduce((m, mod) => Math.max(m, mod.position ?? 0), 0);
    const { error } = await supabase.from("formation_modules").insert({
      formation_id: formation.id,
      title: newModule.trim(),
      position: maxPos + 1,
    });

    setBusy(null);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setNewModule("");
    setMsg(null);
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = modules[i];
    const b = modules[i + dir];
    if (!b) return;

    // Swap atomique : évite la violation de contrainte unique sur (formation_id, position)
    const tmp = -Math.max(a.position, b.position) - 1;

    const { error: e1 } = await supabase
      .from("formation_modules")
      .update({ position: tmp })
      .eq("id", a.id);
    if (e1) {
      setMsg({ ok: false, text: e1.message });
      return;
    }

    const { error: e2 } = await supabase
      .from("formation_modules")
      .update({ position: a.position })
      .eq("id", b.id);
    if (e2) {
      // Rollback
      await supabase.from("formation_modules").update({ position: a.position }).eq("id", a.id);
      setMsg({ ok: false, text: e2.message });
      return;
    }

    const { error: e3 } = await supabase
      .from("formation_modules")
      .update({ position: b.position })
      .eq("id", a.id);
    if (e3) {
      setMsg({ ok: false, text: e3.message });
      return;
    }

    refresh();
  }

  async function delModule(id: string) {
    if (!confirm("Supprimer ce module et toutes ses leçons et activités ?")) return;

    const { error } = await supabase.from("formation_modules").delete().eq("id", id);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    refresh();
  }

  async function submitLesson() {
    if (!lessonInput || !lessonInput.title.trim() || busy) return;
    setBusy("lesson");

    const authRes = await supabase.auth.getUser();
    const user = authRes.data?.user;
    if (!user) {
      setBusy(null);
      setMsg({ ok: false, text: "Session expirée. Reconnectez-vous." });
      return;
    }

    const moduleLessons = lessons.filter((l) => l.module_id === lessonInput.moduleId);
    const maxPos = moduleLessons.reduce((m, l) => Math.max(m, l.position ?? 0), 0);

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        module_id: lessonInput.moduleId,
        title: lessonInput.title.trim(),
        slug: slugify(lessonInput.title) || `lecon-${Date.now()}`,
        position: maxPos + 1,
        content: [],
        created_by: user.id,
        status: "draft",
      })
      .select("id")
      .single();

    setBusy(null);
    if (error || !data) {
      setMsg({ ok: false, text: error?.message ?? "Création impossible." });
      return;
    }

    setLessonInput(null);
    router.push(`/admin/lessons/${data.id}`);
  }

  async function submitActivity() {
    if (!activityInput || !activityInput.title.trim() || busy) return;
    setBusy("activity");

    const { data, error } = await supabase
      .from("activities")
      .insert({
        formation_id: formation.id,
        module_id: activityInput.moduleId,
        title: activityInput.title.trim(),
        type: "quiz",
        configuration: { passing_score: 70, shuffle_answers: true },
      })
      .select("id")
      .single();

    setBusy(null);
    if (error || !data) {
      setMsg({ ok: false, text: error?.message ?? "Création impossible." });
      return;
    }

    setActivityInput(null);
    router.push(`/admin/activities/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-900">{formation.title}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">{formation.status}</span>

          {formation.status === "archived" ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setStatus("draft")}
              disabled={isBusy("status")}
            >
              <RotateCcw className="h-4 w-4" /> Désarchiver
            </button>
          ) : formation.status !== "published" ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setStatus("published")}
              disabled={isBusy("status")}
            >
              <Eye className="h-4 w-4" /> Publier
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setStatus("draft")}
              disabled={isBusy("status")}
            >
              <EyeOff className="h-4 w-4" /> Dépublier
            </button>
          )}

          {formation.status !== "archived" && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setStatus("archived")}
              disabled={isBusy("status")}
            >
              <Archive className="h-4 w-4" /> Archiver
            </button>
          )}
        </div>
      </div>

      <section className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Titre</label>
            <input
              className="input"
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label flex items-center gap-2">
              <Link2 className="h-4 w-4 text-slate-400" />
              Slug (URL)
            </label>
            <div className="flex gap-2">
              <input
                className="input flex-1 font-mono text-xs"
                value={f.slug}
                onChange={(e) => setF({ ...f, slug: e.target.value })}
                placeholder="mon-slug"
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setF({ ...f, slug: slugify(f.title) })}
                title="Régénérer à partir du titre"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Régénérer
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              URL de l&apos;image de couverture
            </label>
            <input
              className="input"
              type="url"
              value={f.cover_url}
              onChange={(e) => setF({ ...f, cover_url: e.target.value })}
              placeholder="https://exemple.com/image.jpg"
            />
          </div>

          <div>
            <label className="label">Catégorie</label>
            <input
              className="input"
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Prix (FCFA)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={f.price}
              onChange={(e) => setF({ ...f, price: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Niveau</label>
            <select
              className="input"
              value={f.difficulty}
              onChange={(e) => setF({ ...f, difficulty: e.target.value as Difficulty })}
            >
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
            </select>
          </div>
          <div>
            <label className="label">Durée (jours)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={f.duration_days}
              onChange={(e) => setF({ ...f, duration_days: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={3}
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Objectifs (un par ligne)</label>
          <textarea
            className="input"
            rows={4}
            value={f.objectives}
            onChange={(e) => setF({ ...f, objectives: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
            checked={f.allow_partial_access}
            onChange={(e) => setF({ ...f, allow_partial_access: e.target.checked })}
          />
          Accès dès le premier versement (paiement fractionné)
        </label>

        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={save} disabled={!!busy}>
            {isBusy("save") ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </button>

          {msg && (
            <span
              role="alert"
              className={`flex items-center gap-1 text-sm ${
                msg.ok ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {msg.text}
            </span>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-900">Modules &amp; leçons</h2>

        {modules.map((m, i) => (
          <div key={m.id} className="card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <b className="text-slate-900">
                {i + 1}. {m.title}
              </b>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Monter"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => move(i, 1)}
                  disabled={i === modules.length - 1}
                  aria-label="Descendre"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => delModule(m.id)}
                  aria-label="Supprimer le module"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <ul className="space-y-1.5 text-sm">
              {(lessonsByModule[m.id] ?? []).map((l) => (
                <li key={l.id} className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-600" />
                  <Link
                    className="font-medium text-brand-700 hover:underline"
                    href={`/admin/lessons/${l.id}`}
                  >
                    {l.title}
                  </Link>
                  <span className="chip">{l.status}</span>
                </li>
              ))}
              {(activitiesByModule[m.id] ?? []).map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent-600" />
                  <Link
                    className="font-medium text-accent-700 hover:underline"
                    href={`/admin/activities/${a.id}`}
                  >
                    {a.title}
                  </Link>
                  <span className="chip">{a.status}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              {lessonInput && lessonInput.moduleId === m.id ? (
                <div className="flex w-full flex-wrap gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Titre de la leçon"
                    autoFocus
                    value={lessonInput.title}
                    onChange={(e) =>
                      setLessonInput((prev) => (prev ? { ...prev, title: e.target.value } : null))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitLesson();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={submitLesson}
                    disabled={isBusy("lesson")}
                  >
                    {isBusy("lesson") ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Créer
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setLessonInput(null)}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setLessonInput({ moduleId: m.id, title: "" })}
                >
                  <Plus className="h-3.5 w-3.5" /> Leçon
                </button>
              )}

              {activityInput && activityInput.moduleId === m.id ? (
                <div className="flex w-full flex-wrap gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Titre de l'activité (quiz)"
                    autoFocus
                    value={activityInput.title}
                    onChange={(e) =>
                      setActivityInput((prev) => (prev ? { ...prev, title: e.target.value } : null))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitActivity();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={submitActivity}
                    disabled={isBusy("activity")}
                  >
                    {isBusy("activity") ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Créer
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActivityInput(null)}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActivityInput({ moduleId: m.id, title: "" })}
                >
                  <Plus className="h-3.5 w-3.5" /> Quiz du module
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Titre du nouveau module"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addModule();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={addModule}
            disabled={isBusy("add-module")}
          >
            {isBusy("add-module") ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Ajouter
          </button>
        </div>
      </section>
    </div>
  );
}