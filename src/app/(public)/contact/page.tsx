export default function Contact() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@ombrelle-academy.com";
  return <div className="card max-w-xl space-y-3"><h1 className="text-2xl font-bold text-brand-900">Contact</h1><p className="text-slate-700">Une question ? Écris-nous à <a className="font-semibold text-brand-700 underline" href={`mailto:${email}`}>{email}</a>.</p><p className="text-xs text-slate-400">TODO : formulaire de contact avec envoi email (Edge Function).</p></div>;
}
