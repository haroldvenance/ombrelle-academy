import Link from "next/link";
import { Umbrella } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-900 transition-opacity hover:opacity-80">
          <Umbrella className="h-8 w-8 text-indigo-600" />
          <span>OMBRELLE <span className="text-indigo-600">Academy</span></span>
        </Link>
        <h2 className="mt-2 text-center text-sm text-slate-500">
          La plateforme EdTech pour réussir votre avenir financier.
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} OMBRELLE Academy. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}