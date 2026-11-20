import Link from "next/link";
import type { Block } from "@/types";

function Paragraphs({ text }: { text?: string }) {
  return <>{(text ?? "").split("\n").map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}</>;
}

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4 text-slate-800">
      {(blocks ?? []).map((b, i) => {
        switch (b.type) {
          case "heading": return <h2 key={i} className="pt-2 text-xl font-bold text-brand-900">{b.text}</h2>;
          case "text": return <div key={i} className="space-y-2"><Paragraphs text={b.text} /></div>;
          case "definition": return <div key={i} className="rounded-xl border-l-4 border-brand-600 bg-brand-50 p-4"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">Définition</div><Paragraphs text={b.text} /></div>;
          case "example": return <div key={i} className="rounded-xl border-l-4 border-accent-500 bg-accent-50 p-4"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-accent-700">Exemple</div><Paragraphs text={b.text} /></div>;
          case "warning": return <div key={i} className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">Attention</div><Paragraphs text={b.text} /></div>;
          case "summary": return <div key={i} className="rounded-xl bg-emerald-50 p-4"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">À retenir</div><Paragraphs text={b.text} /></div>;
          case "quote": return <blockquote key={i} className="border-l-4 border-slate-300 pl-4 italic text-slate-600"><Paragraphs text={b.text} /></blockquote>;
          case "question": return <div key={i} className="rounded-xl border border-dashed border-brand-500 p-4"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">Réfléchis</div><Paragraphs text={b.text} /></div>;
          case "list": return <ul key={i} className="list-disc space-y-1 pl-6">{(b.items ?? []).map((it, j) => <li key={j}>{it}</li>)}</ul>;
          case "image": return b.url ? (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.url} alt={b.caption ?? ""} className="max-w-full rounded-xl" loading="lazy" />
              {b.caption && <figcaption className="mt-1 text-center text-xs text-slate-500">{b.caption}</figcaption>}
            </figure>) : null;
          case "table": return (
            <div key={i} className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100"><tr>{(b.headers ?? []).map((h, j) => <th key={j} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
                <tbody>{(b.rows ?? []).map((r, j) => <tr key={j} className="border-t border-slate-200">{r.map((c, k) => <td key={k} className="px-3 py-2">{c}</td>)}</tr>)}</tbody>
              </table>
            </div>);
          case "activity": return b.activity_id ? <Link key={i} href={`/learning/activity/${b.activity_id}`} className="btn btn-accent">🎯 {b.text || "Lancer l'activité"}</Link> : null;
          default: return null;
        }
      })}
    </div>
  );
}
