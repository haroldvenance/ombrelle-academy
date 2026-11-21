import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import { LayoutDashboard, BookOpen, HelpCircle, Users, CreditCard } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/formations", label: "Formations", icon: BookOpen },
  { href: "/admin/questions", label: "Banque de questions", icon: HelpCircle },
  { href: "/admin/students", label: "Étudiants", icon: Users },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader profile={profile} />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-12">
        <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
          {NAV.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-b-2 border-transparent transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}