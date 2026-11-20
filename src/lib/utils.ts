export function cn(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

export function formatPrice(price: number | string, currency = "XAF") {
  const n = Number(price);
  if (!n) return "Gratuit";
  return `${new Intl.NumberFormat("fr-FR").format(n)} ${currency === "XAF" ? "FCFA" : currency}`;
}

export function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const DIFFICULTY_LABEL: Record<string, string> = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", easy: "Facile", medium: "Moyen", hard: "Difficile" };
export const MODE_LABEL: Record<string, string> = { classic: "Classique", interactive: "Interactif", intensive: "Intensif" };
export const MODE_DESC: Record<string, string> = {
  classic: "Progression structurée : cours, exemples, quiz, validation.",
  interactive: "Contenu découpé, interactions fréquentes, défis et récompenses.",
  intensive: "Rythme accéléré : quiz supplémentaires, révisions régulières.",
};
