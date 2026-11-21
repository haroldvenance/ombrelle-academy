import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MarkRead from "@/components/MarkRead";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";

export default async function Notifications() {
  await requireUser();
  const supabase = createClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Bell className="h-6 w-6 text-slate-500" /> Notifications
        </h1>
        <MarkRead />
      </div>
      
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
        {(data ?? []).map((n: any) => (
          <div key={n.id} className={`p-5 ${n.read_at ? "opacity-70" : "bg-indigo-50/30"}`}>
            <div className="flex justify-between items-start gap-4 mb-1">
              <h3 className="font-medium text-slate-900 text-sm">{n.title}</h3>
              <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(n.created_at)}</span>
            </div>
            {n.body && <p className="text-sm text-slate-600 mt-1">{n.body}</p>}
          </div>
        ))}
        {!data?.length && (
          <div className="p-12 text-center text-slate-500">
            <Bell className="h-8 w-8 mx-auto text-slate-300 mb-3" />
            <p>Vous n'avez aucune notification.</p>
          </div>
        )}
      </div>
    </div>
  );
}