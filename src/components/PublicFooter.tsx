import Link from "next/link";
import { Umbrella } from "lucide-react";

const LEGAL = [
  { href: "/a-propos", label: "À propos" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/cgu", label: "CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
];

export default function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Umbrella className="h-4 w-4 text-brand-700" />
            OMBRELLE Academy
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-brand-800">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          © {new Date().getFullYear()} OMBRELLE Academy. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}