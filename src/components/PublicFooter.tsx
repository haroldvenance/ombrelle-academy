import Link from "next/link";
import { Umbrella, Mail } from "lucide-react";
import { env } from "@/lib/env";

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
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-800"
          >
            <Umbrella className="h-4 w-4 text-brand-700" aria-hidden="true" />
            OMBRELLE Academy
          </Link>
          <nav
            aria-label="Liens légaux"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"
          >
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-brand-800">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} OMBRELLE Academy. Tous droits réservés.
          </p>
          <a
            href={`mailto:${env.contactEmail}`}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-800 break-all"
          >
            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
            {env.contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}