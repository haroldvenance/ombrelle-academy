import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";

const NAV = [["/admin", "Tableau de bord"], ["/admin/formations", "Formations"], ["/admin/questions", "Banque de questions"], ["/admin/students", "Étudiants"], ["/admin/payments", "Paiements"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  return (
    <>
      <AppHeader profile={profile} />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 md:pb-10">
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">{NAV.map(([h, l]) => <Link key={h} href={h} className="chip whitespace-nowrap !bg-accent-100 !text-accent-700">{l}</Link>)}</nav>
        {children}
      </div>
    </>
  );
}
