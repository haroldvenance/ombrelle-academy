import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><PublicHeader /><main className="mx-auto max-w-6xl px-4 py-8">{children}</main><PublicFooter /></>;
}
