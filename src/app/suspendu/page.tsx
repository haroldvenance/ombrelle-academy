import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, Mail } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Compte suspendu",
  description: "Votre compte est temporairement suspendu.",
};

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "zalatechentreprise@gmail.com";

export default function Suspended() {
  return (
    <main className="mx-auto mt-24 max-w-md px-4">
      <div className="card space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="h-7 w-7 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">Compte suspendu</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Votre accès est temporairement suspendu. Contactez l&apos;équipe OMBRELLE
            pour plus d&apos;informations.
          </p>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 break-all"
        >
          <Mail className="h-4 w-4 shrink-0" />
          {SUPPORT_EMAIL}
        </a>
        <div className="border-t border-slate-100 pt-4">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}