import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MarkRead from "@/components/MarkRead";
import { formatDate } from "@/lib/utils";

export default async function Notifications() {
  await requireUser();
  const supabase = createClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-brand-900">Notifications</h1><MarkRead /></div>
      <div className="space-y-2">
        {(data ?? []).map((n: any) => (
          <div key={n.id} className={`card !p-4 ${n.read_at ? "" : "border-brand-500"}`}>
            <div className="flex justify-between gap-2"><b>{n.title}</b><span className="text-xs text-slate-400">{formatDate(n.created_at)}</span></div>
            {n.body && <p className="text-sm text-slate-600">{n.body}</p>}
          </div>
        ))}
        {!data?.length && <p className="text-slate-500">Aucune notification.</p>}
      </div>
    </div>
  );
}
