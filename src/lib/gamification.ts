export type Level = { level_number: number; name: string; required_xp: number };

export type LevelProgress = {
  current: Level;
  next: Level | null;
  pct: number;
  remaining: number;
  isMax: boolean;
};

const DEFAULT_LEVELS: Level[] = [{ level_number: 1, name: "Débutant", required_xp: 0 }];

/**
 * Calcule la progression d'un utilisateur dans la hiérarchie de niveaux.
 *
 * Robustesse :
 * - `levels` vide ou null → utilise un niveau par défaut.
 * - `totalXp` négatif ou NaN → traité comme 0.
 * - `next` = null propre quand le joueur a atteint le niveau max.
 * - Division par zéro impossible (range <= 0 → pct = 100).
 */
export function levelProgress(totalXp: number, levels: Level[]): LevelProgress {
  const safeXp = Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0;
  const sorted = (levels?.length ? [...levels] : DEFAULT_LEVELS).sort(
    (a, b) => a.level_number - b.level_number
  );

  let current = sorted[0];
  for (const l of sorted) {
    if (safeXp >= l.required_xp) current = l;
  }

  const next = sorted.find((l) => l.level_number === current.level_number + 1) ?? null;

  if (!next) {
    return { current, next: null, pct: 100, remaining: 0, isMax: true };
  }

  const range = next.required_xp - current.required_xp;
  const gained = safeXp - current.required_xp;
  const pct = range > 0 ? Math.min(100, Math.max(0, Math.round((gained / range) * 100))) : 100;

  return {
    current,
    next,
    pct,
    remaining: Math.max(0, next.required_xp - safeXp),
    isMax: false,
  };
}