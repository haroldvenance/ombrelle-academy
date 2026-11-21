import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Exécute le middleware sur toutes les routes SAUF :
     * - fichiers statiques Next.js (_next/static, _next/image)
     * - ressources publiques (favicon, robots, sitemap, manifest)
     * - fichiers médias (images, polices)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};