"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button className="text-sm font-medium text-slate-600 hover:text-brand-800" onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}>
      Déconnexion
    </button>
  );
}
