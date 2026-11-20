import { requireUser } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  return <><AppHeader profile={profile} /><main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-10">{children}</main></>;
}
