export type Level = { level_number: number; name: string; required_xp: number };

/** Niveau courant + progression vers le suivant (affichage uniquement : le calcul officiel est côté serveur). */
export function levelProgress(totalXp: number, levels: Level[]) {
  const sorted = [...levels].sort((a, b) => a.level_number - b.level_number);
  let current = sorted[0];
  for (const l of sorted) if (totalXp >= l.required_xp) current = l;
  const next = sorted.find((l) => l.level_number === current.level_number + 1);
  const pct = next ? Math.min(100, Math.round(((totalXp - current.required_xp) / (next.required_xp - current.required_xp)) * 100)) : 100;
  return { current, next, pct, remaining: next ? next.required_xp - totalXp : 0 };
}
