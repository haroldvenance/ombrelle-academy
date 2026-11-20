import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function Formations() {
  const supabase = createClient();
  const { data } = await supabase.from("formations").select("*").order("created_at");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-brand-900">Formations</h1><Link className="btn btn-primary" href="/admin/formations/new">+ Nouvelle formation</Link></div>
      <div className="space-y-2">{(data ?? []).map((f: any) => (
        <Link key={f.id} href={`/admin/formations/${f.id}`} className="card flex items-center justify-between !p-4 hover:border-brand-500">
          <div><b>{f.title}</b><div className="text-xs text-slate-500">{f.category} · {formatPrice(f.price, f.currency)}</div></div>
          <span className={`chip ${f.status === "published" ? "chip-green" : "chip-orange"}`}>{f.status}</span></Link>))}</div>
    </div>
  );
}
