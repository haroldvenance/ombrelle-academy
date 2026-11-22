import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env, assertSiteUrlInProd } from "@/lib/env";

export const dynamic = "force-dynamic";

function sanitizeNext(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  if (raw.startsWith("/\\")) return "/dashboard";
  if (raw.includes("://")) return "/dashboard";
  return raw;
}

export async function GET(request: Request) {
  // Garde-fou runtime : si mal configuré en prod, on log et on continue
  // avec le fallback localhost plutôt que de crasher l'utilisateur.
  try {
    assertSiteUrlInProd();
  } catch (e) {
    console.error("[auth/callback]", e);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));
  const errorCode =
    searchParams.get("error_code") ?? searchParams.get("error") ?? null;
  const errorDescription = searchParams.get("error_description") ?? null;

  // env.siteUrl bénéficie du fallback Vercel (VERCEL_PROJECT_PRODUCTION_URL)
  // → retourne https://ombrelle-academy.vercel.app en prod si NEXT_PUBLIC_SITE_URL absent
  const base = env.siteUrl;

  // Cas 1 : Supabase signale une erreur (lien expiré, etc.)
  if (errorCode) {
    const qs = new URLSearchParams({ error: errorCode });
    if (errorDescription) qs.set("detail", errorDescription);
    return NextResponse.redirect(`${base}/connexion?${qs.toString()}`);
  }

  // Cas 2 : pas de code → rien à échanger
  if (!code) {
    return NextResponse.redirect(`${base}/connexion?error=callback`);
  }

  // Cas 3 : échange du code pour créer une session
  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", {
      message: error.message,
      status: error.status,
    });
    const qs = new URLSearchParams({
      error: "callback",
      detail: error.message,
    });
    return NextResponse.redirect(`${base}/connexion?${qs.toString()}`);
  }

  return NextResponse.redirect(`${base}${next}`);
}