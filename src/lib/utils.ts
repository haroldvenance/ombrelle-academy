export function cn(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

// ─── Monnaie ────────────────────────────────────────────────────
const CURRENCY_LABEL: Record<string, string> = {
  XAF: "FCFA",
  XOF: "FCFA",
  EUR: "€",
  USD: "$",
};

export function formatPrice(
  price: number | string | null | undefined,
  currency = "XAF"
): string {
  if (price === null || price === undefined || price === "") return "Gratuit";
  const n = Number(price);
  if (!Number.isFinite(n) || n === 0) return "Gratuit";
  const label = CURRENCY_LABEL[currency] ?? currency;
  return `${new Intl.NumberFormat("fr-FR").format(n)} ${label}`;
}

// ─── Dates ──────────────────────────────────────────────────────
function toDate(d?: string | Date | null): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export function formatDate(d?: string | Date | null): string {
  const dt = toDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d?: string | Date | null): string {
  const dt = toDate(d);
  if (!dt) return "—";
  return dt.toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatRelative(d?: string | Date | null): string {
  const dt = toDate(d);
  if (!dt) return "—";
  const diffMs = Date.now() - dt.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffH = Math.round(diffMin / 60);
  const diffD = Math.round(diffH / 24);
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute");
  if (Math.abs(diffH) < 24) return rtf.format(-diffH, "hour");
  if (Math.abs(diffD) < 30) return rtf.format(-diffD, "day");
  return formatDate(dt);
}

// ─── Chaînes ────────────────────────────────────────────────────
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

// ─── Libellés ───────────────────────────────────────────────────
export const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
};

export const MODE_LABEL: Record<string, string> = {
  classic: "Classique",
  interactive: "Interactif",
  intensive: "Intensif",
};

export const MODE_DESC: Record<string, string> = {
  classic: "Progression structurée : cours, exemples, quiz, validation.",
  interactive: "Contenu découpé, interactions fréquentes, défis et récompenses.",
  intensive: "Rythme accéléré : quiz supplémentaires, révisions régulières.",
};