import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { AUTH_PATHS, PROTECTED_PATHS, REDIRECT } from "@/lib/constants";

/**
 * Rafraîchit la session et applique les règles d'accès.
 * - Non authentifié + route protégée → /connexion?next=…
 * - Authentifié + page d'auth → /dashboard
 * - Authentifié mais suspendu → /suspendu (sauf pages whitelistées)
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  const isAuthPage = AUTH_PATHS.some((p) => path === p);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = REDIRECT.login;
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = REDIRECT.dashboard;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Vérifie la suspension pour les utilisateurs connectés.
  // On exclut les routes permettant de la constater / de se déconnecter.
  if (user) {
    const suspendedWhitelist =
      path === "/suspendu" ||
      path === "/connexion" ||
      path === "/auth/callback" ||
      path.startsWith("/_next");

    if (!suspendedWhitelist) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_suspended")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_suspended) {
        const url = request.nextUrl.clone();
        url.pathname = REDIRECT.suspended;
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}