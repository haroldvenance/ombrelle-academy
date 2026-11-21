/**
 * Centralisation des variables d'environnement.
 * Échoue au démarrage si une variable critique manque — préférable à un
 * comportement silencieux en production.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Variable d'environnement manquante ou vide : ${key}\n` +
      `Vérifiez votre fichier .env.local (voir .env.example).`
    );
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  siteUrl: optional("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  contactEmail: optional("NEXT_PUBLIC_CONTACT_EMAIL", "venanceharold@gmail.com"),
  paymentInstructions: optional("NEXT_PUBLIC_PAYMENT_INSTRUCTIONS", ""),
} as const;