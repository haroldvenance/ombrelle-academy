import Link from "next/link";
import { Umbrella, Menu } from "lucide-react";
import { getCurrent } from "@/lib/auth";

export default async function PublicHeader() {
  const c = await getCurrent();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-extrabold text-brand-800 transition-opacity hover:opacity-80"
        >
          <Umbrella className="h-5 w-5" aria-hidden="true" />
          <span>
            OMBRELLE <span className="text-accent-600">Academy</span>
          </span>
        </Link>

        <nav
          aria-label="Navigation publique"
          className="flex items-center gap-3 text-sm font-medium sm:gap-4"
        >
          <Link
            href="/formations"
            className="hidden text-slate-700 hover:text-brand-800 sm:block"
          >
            Formations
          </Link>
          <Link
            href="/faq"
            className="hidden text-slate-700 hover:text-brand-800 sm:block"
          >
            FAQ
          </Link>

          {/* Menu mobile (CSS-only via <details>) */}
          <details className="relative sm:hidden">
            <summary
              className="list-none cursor-pointer rounded-lg p-1.5 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5 text-slate-700" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-full z-40 mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
              <Link
                href="/formations"
                className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Formations
              </Link>
              <Link
                href="/faq"
                className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Contact
              </Link>
            </div>
          </details>

          {c ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                href="/connexion"
                className="hidden text-slate-700 hover:text-brand-800 sm:block"
              >
                Connexion
              </Link>
              <Link href="/inscription" className="btn btn-primary btn-sm">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}