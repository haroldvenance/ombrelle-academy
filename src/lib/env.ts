/**
 * Centralisation des variables d'environnement.
 *
 * ⚠️ Règle Next.js : les variables NEXT_PUBLIC_* doivent être référencées
 * LITTÉRALEMENT (process.env.NEXT_PUBLIC_X) pour être inlinées au build.
 * Un accès dynamique (process.env[key]) renvoie undefined côté client.
 *
 * Stratégie siteUrl (côté serveur uniquement) :
 *   1. NEXT_PUBLIC_SITE_URL (explicite, recommandé)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (domaine de prod auto-détecté)
 *   3. VERCEL_URL (déploiement courant, incl. previews)
 *   4. http://localhost:3000 (dev)
 *
 * ⚠️ Les variables VERCEL_* sont server-only : elles ne sont PAS visibles
 * côté client. Pour les composants `"use client"`, utiliser
 * `window.location.origin` (toujours juste) ou NEXT_PUBLIC_SITE_URL.
 *
 * Aucun throw au chargement du module : on ne bloque pas la phase
 * "Collecting page data" de Next. Le throw éventuel se fait au runtime
 * via `assertSiteUrlInProd()` dans les Route Handlers / Server Actions.
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

function normalizeUrl(url: string): string {
  let u = url.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

/**
 * Construit l'URL publique du site en tenant compte de Vercel.
 * À utiliser uniquement côté serveur (Route Handlers, Server Actions, RSC).
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalizeUrl(explicit);

  // Vercel injecte ces variables automatiquement (non-NEXT_PUBLIC → serveur only)
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) return normalizeUrl(vercelProd);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return normalizeUrl(vercelUrl);

  return "http://localhost:3000";
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
  siteUrl: resolveSiteUrl(),
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
    "NEXT_PUBLIC_PAYMENT_INSTRUCTIONS",
    ""
  ),
} as const;

/**
 * À appeler uniquement dans les Server Actions / Route Handlers qui
 * construisent des liens email absolus (reset password, confirmation…),
 * PAS pendant le build.
 */
export function assertSiteUrlInProd(): void {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PUBLIC_SITE_URL?.trim() &&
    !process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() &&
    !process.env.VERCEL_URL?.trim()
  ) {
    throw new Error(
      "[env] NEXT_PUBLIC_SITE_URL doit être défini en production " +
        "(ex: https://app.exemple.com)."
    );
  }
}