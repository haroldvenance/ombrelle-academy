import Link from "next/link";
import { ArrowLeft, Brain } from "lucide-react";
import { requireUser } from "@/lib/auth";
import ReviewSession from "@/components/ReviewSession";

export default async function RevisionsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Tableau de bord
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Brain className="h-6 w-6 text-brand-700" />
          Révisions espacées
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Revoyez les notions que vous risquez d&apos;oublier. Les intervalles s&apos;allongent à chaque réussite.
        </p>
      </div>

      <ReviewSession />
    </div>
  );
}