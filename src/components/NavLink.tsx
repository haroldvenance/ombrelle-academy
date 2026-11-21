"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  activeColor?: "brand" | "accent";
};

export default function NavLink({ href, label, icon, badge, activeColor = "brand" }: Props) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const activeCls =
    activeColor === "accent"
      ? "bg-accent-50 text-accent-700"
      : "bg-brand-50 text-brand-800";

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
        active ? activeCls : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}