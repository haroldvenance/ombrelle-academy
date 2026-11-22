import Link from "next/link";
import { Umbrella, Mail } from "lucide-react";

const LEGAL = [
  { href: "/a-propos", label: "À propos" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/cgu", label: "CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
];

export default function PublicFooter() {
  // Valeur de secours si la variable n'est pas définie sur Vercel
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@zalatech.net";

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-slate-900 hover:opacity-80 transition-opacity"
            >
              <Umbrella className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              OMBRELLE Academy
            </Link>
            <p className="text-sm text-slate-500 text-center md:text-left max-w-xs">
              La plateforme EdTech pour maîtriser vos finances et développer votre business en Afrique.
            </p>
          </div>

          {/* Liens légaux */}
          <nav
            aria-label="Liens légaux"
            className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600"
          >
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-indigo-600 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Ligne de séparation */}
        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} OMBRELLE Academy (ZALATECH). Tous droits réservés.
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors break-all"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            {contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}