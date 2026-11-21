"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
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
} from "lucide-react";

export default function FormationEditor({
  formation,
  modules,
  lessons,
  activities,
}: {
  formation: any;
  modules: any[];
  lessons: any[];
  activities: any[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [f, setF] = useState({
    title: formation.title,
    description: formation.description ?? "",
    category: formation.category ?? "",
    price: String(formation.price),
    difficulty: formation.difficulty,
    duration_days: String(formation.duration_days ?? ""),
    allow_partial_access: formation.allow_partial_access,
    objectives: (formation.objectives ?? []).join("\n"),
  });

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newModule, setNewModule] = useState("");

  const [lessonInput, setLessonInput] = useState<{
    moduleId: string;
    title: string;
  } | null>(null);

  const [activityInput, setActivityInput] = useState<{
    moduleId: string;
    title: string;
  } | null>(null);

  const refresh = () => router.refresh();

  async function save() {
    const { error } = await supabase
      .from("formations")
      .update({
        title: f.title,
        description: f.description,
        category: f.category,
        price: Number(f.price),
        difficulty: f.difficulty,
        duration_days: f.duration_days
          ? Number(f.duration_days)
          : null,
        allow_partial_access: f.allow_partial_access,
        objectives: f.objectives
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean),
      })
      .eq("id", formation.id);

    setMsg({
      ok: !error,
      text: error
        ? error.message
        : "Modifications enregistrées.",
    });

    refresh();
  }

  async function setStatus(status: string) {
    const { error } = await supabase
      .from("formations")
      .update({
        status,
        published_at:
          status === "published"
            ? new Date().toISOString()
            : formation.published_at,
      })
      .eq("id", formation.id);

    setMsg({
      ok: !error,
      text: error ? error.message : `Statut : ${status}`,
    });

    refresh();
  }

  async function addModule() {
    if (!newModule.trim()) return;

    const { error } = await supabase
      .from("formation_modules")
      .insert({
        formation_id: formation.id,
        title: newModule.trim(),
        position: modules.length + 1,
      });

    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }

    setNewModule("");
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = modules[i];
    const b = modules[i + dir];

    if (!b) return;

    await supabase
      .from("formation_modules")
      .update({ position: b.position })
      .eq("id", a.id);

    await supabase
      .from("formation_modules")
      .update({ position: a.position })
      .eq("id", b.id);

    refresh();
  }

  async function delModule(id: string) {
    if (
      !confirm(
        "Supprimer ce module et toutes ses leçons et activités ?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("formation_modules")
      .delete()
      .eq("id", id);

    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }

    refresh();
  }

  async function submitLesson() {
    if (!lessonInput || !lessonInput.title.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const n =
      lessons.filter(
        (l) => l.module_id === lessonInput.moduleId
      ).length + 1;

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        module_id: lessonInput.moduleId,
        title: lessonInput.title.trim(),
        slug: slugify(lessonInput.title) || `lecon-${n}`,
        position: n,
        content: [],
        created_by: user?.id,
      })
      .select("id")
      .single();

    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }

    setLessonInput(null);
    router.push(`/admin/lessons/${data.id}`);
  }

  async function submitActivity() {
    if (!activityInput || !activityInput.title.trim()) return;

    const { data, error } = await supabase
      .from("activities")
      .insert({
        formation_id: formation.id,
        module_id: activityInput.moduleId,
        title: activityInput.title.trim(),
        type: "quiz",
        configuration: {
          passing_score: 70,
          shuffle_answers: true,
        },
      })
      .select("id")
      .single();

    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }

    setActivityInput(null);
    router.push(`/admin/activities/${data.id}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-900">
          {formation.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">{formation.status}</span>

          {formation.status !== "published" ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setStatus("published")}
            >
              <Eye className="h-4 w-4" />
              Publier
            </button>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setStatus("draft")}
            >
              <EyeOff className="h-4 w-4" />
              Dépublier
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setStatus("archived")}
          >
            <Archive className="h-4 w-4" />
            Archiver
          </button>
        </div>
      </div>

      {/* Formation details */}
      <section className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Titre</label>
            <input
              className="input"
              value={f.title}
              onChange={(e) =>
                setF({ ...f, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Catégorie</label>
            <input
              className="input"
              value={f.category}
              onChange={(e) =>
                setF({ ...f, category: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Prix (FCFA)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={f.price}
              onChange={(e) =>
                setF({ ...f, price: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Niveau</label>
            <select
              className="input"
              value={f.difficulty}
              onChange={(e) =>
                setF({ ...f, difficulty: e.target.value })
              }
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
              value={f.duration_days}
              onChange={(e) =>
                setF({
                  ...f,
                  duration_days: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={3}
            value={f.description}
            onChange={(e) =>
              setF({ ...f, description: e.target.value })
            }
          />
        </div>

        <div>
          <label className="label">
            Objectifs (un par ligne)
          </label>
          <textarea
            className="input"
            rows={4}
            value={f.objectives}
            onChange={(e) =>
              setF({ ...f, objectives: e.target.value })
            }
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
            checked={f.allow_partial_access}
            onChange={(e) =>
              setF({
                ...f,
                allow_partial_access: e.target.checked,
              })
            }
          />

          Accès dès le premier versement (paiement fractionné)
        </label>

        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={save}>
            <Save className="h-4 w-4" />
            Enregistrer
          </button>

          {msg && (
            <span
              className={`flex items-center gap-1 text-sm ${
                msg.ok ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {msg.ok ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}

              {msg.text}
            </span>
          )}
        </div>
      </section>

      {/* Modules and lessons */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-900">
          Modules & leçons
        </h2>

        {modules.map((m, i) => (
          <div key={m.id} className="card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <b className="text-slate-900">
                {i + 1}. {m.title}
              </b>

              <div className="flex gap-1">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => move(i, -1)}
                  title="Monter"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => move(i, 1)}
                  title="Descendre"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => delModule(m.id)}
                  title="Supprimer le module"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Lessons and activities list */}
            <ul className="space-y-1.5 text-sm">
              {lessons
                .filter((l) => l.module_id === m.id)
                .map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-2"
                  >
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

              {activities
                .filter(
                  (a) =>
                    a.module_id === m.id && !a.lesson_id
                )
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2"
                  >
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

            {/* Add lesson or activity */}
            <div className="flex flex-wrap gap-2">
              {lessonInput &&
              lessonInput.moduleId === m.id ? (
                <div className="flex w-full flex-wrap gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Titre de la leçon"
                    autoFocus
                    value={lessonInput.title}
                    onChange={(e) =>
                      setLessonInput((prev) =>
                        prev
                          ? {
                              ...prev,
                              title: e.target.value,
                            }
                          : null
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        submitLesson();
                      }
                    }}
                  />

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={submitLesson}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Créer
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setLessonInput(null)}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setLessonInput({
                      moduleId: m.id,
                      title: "",
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Leçon
                </button>
              )}

              {/* Activity form */}
              {activityInput &&
              activityInput.moduleId === m.id ? (
                <div className="flex w-full flex-wrap gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Titre de l'activité (quiz)"
                    autoFocus
                    value={activityInput.title}
                    onChange={(e) =>
                      setActivityInput((prev) =>
                        prev
                          ? {
                              ...prev,
                              title: e.target.value,
                            }
                          : null
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        submitActivity();
                      }
                    }}
                  />

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={submitActivity}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Créer
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActivityInput(null)}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setActivityInput({
                      moduleId: m.id,
                      title: "",
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Quiz du module
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add module */}
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Titre du nouveau module"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addModule();
              }
            }}
          />

          <button
            className="btn btn-primary"
            onClick={addModule}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </section>
    </div>
  );
}