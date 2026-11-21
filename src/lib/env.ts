/**
 * Centralisation des variables d'environnement.
 * Échoue au démarrage si une variable critique manque — préférable à un
 * comportement silencieux en production.
 *
 * ⚠️ Règle Next.js importante :
 * Les variables NEXT_PUBLIC_* doivent être référencées LITTÉRALEMENT dans le
 * code (ex. `process.env.NEXT_PUBLIC_SUPABASE_URL`) pour que Next.js les
 * remplace au moment du build côté client. Un accès dynamique du type
 * `process.env[key]` renvoie toujours `undefined` dans le navigateur.
 * C'est pourquoi chaque variable est passée explicitement à `required` /
 * `optional`, et non via une clé sous forme de chaîne.
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

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
  siteUrl: optional(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000"),
  contactEmail: optional(
    "NEXT_PUBLIC_CONTACT_EMAIL",
    "venanceharold@gmail.com"
  ),
  paymentInstructions: optional(
    process.env.NEXT_PUBLIC_PAYMENT_INSTRUCTIONS,
    ""
  ),
} as const;