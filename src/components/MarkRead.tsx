"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MarkRead() {
  const router = useRouter();
  return <button className="btn btn-secondary btn-sm" onClick={async () => { await createClient().rpc("mark_notifications_read"); router.refresh(); }}>Tout marquer comme lu</button>;
}
