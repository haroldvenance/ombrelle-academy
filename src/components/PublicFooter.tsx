import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500">
        <span>© {new Date().getFullYear()} OMBRELLE Academy</span>
        <div className="flex flex-wrap gap-4">
          <Link href="/a-propos">À propos</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link>
          <Link href="/cgu">CGU</Link><Link href="/confidentialite">Confidentialité</Link>
        </div>
      </div>
    </footer>
  );
}
