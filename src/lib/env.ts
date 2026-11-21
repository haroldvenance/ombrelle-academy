/**
 * Centralisation des variables d'environnement.
 *
 * ⚠️ Règle Next.js : les variables NEXT_PUBLIC_* doivent être référencées
 * LITTÉRALEMENT (process.env.NEXT_PUBLIC_X) pour être inlinées au build.
 * Un accès dynamique (process.env[key]) renvoie undefined côté client.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Variable d'environnement manquante ou vide : ${name}\n` +
        `Vérifiez votre fichier .env.local (voir .env.example).`
    );
  }
  return value;
}

function optional(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

/**
 * Comme `optional`, mais exige une valeur non vide en production.
 * Évite les liens email cassés (siteUrl = localhost:3000 en prod).
 */
function requiredInProd(name: string, value: string | undefined, fallback: string): string {
  const v = value?.trim();
  if (v) return v;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `[env] ${name} est requis en production (ex: https://app.exemple.com).`
    );
  }
  return fallback;
}

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
  siteUrl: requiredInProd(
    "NEXT_PUBLIC_SITE_URL",
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3000"
  ),
  contactEmail: optional(
    "NEXT_PUBLIC_CONTACT_EMAIL",
    "venanceharold@gmail.com"
  ),
  supportEmail: optional(
    "NEXT_PUBLIC_SUPPORT_EMAIL",
    "zalatechentreprise@gmail.com"
  ),
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  paymentInstructions: optional(
    process.env.NEXT_PUBLIC_PAYMENT_INSTRUCTIONS,
    ""
  ),
} as const;