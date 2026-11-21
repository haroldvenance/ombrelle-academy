import Link from "next/link";
import { Umbrella } from "lucide-react";
import { getCurrent } from "@/lib/auth";

export default async function PublicHeader() {
  const c = await getCurrent();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-800 transition-opacity hover:opacity-80">
          <Umbrella className="h-5 w-5" />
          <span>OMBRELLE <span className="text-accent-600">Academy</span></span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/formations" className="hidden text-slate-700 hover:text-brand-800 sm:block">Formations</Link>
          <Link href="/faq" className="hidden text-slate-700 hover:text-brand-800 sm:block">FAQ</Link>
          {c ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Mon espace</Link>
          ) : (
            <>
              <Link href="/connexion" className="text-slate-700 hover:text-brand-800">Connexion</Link>
              <Link href="/inscription" className="btn btn-primary btn-sm">Créer un compte</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}