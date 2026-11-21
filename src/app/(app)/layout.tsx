import { requireUser } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:pb-12">
        {children}
      </main>
    </div>
  );
}