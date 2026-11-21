"use client";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@ombrelle-academy.com";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO : Connecter à une Edge Function ou un service tiers (Resend, EmailJS...)
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Contactez-nous</h1>
        <p className="text-slate-500 mt-2">Une question sur une formation, un problème de paiement ? Notre équipe est là pour vous aider.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulaire */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Message envoyé</h2>
              <p className="text-sm text-slate-500">Nous vous répondrons dans les plus brefs délais.</p>
              <button onClick={() => setSent(false)} className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="Votre nom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input required type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="vous@exemple.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sujet</label>
                <input required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="Comment pouvons-nous vous aider ?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea required rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="Votre message..." />
              </div>
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors">
                <Send className="h-4 w-4" /> Envoyer le message
              </button>
            </form>
          )}
        </div>

        {/* Coordonnées */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
            <div className="rounded-full bg-indigo-50 p-3 shrink-0">
              <Mail className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Email</h3>
              <p className="text-sm text-slate-500 mt-1">Pour toute demande générale</p>
              <a href={`mailto:${email}`} className="text-sm font-medium text-indigo-600 mt-1 inline-block hover:underline">{email}</a>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
            <div className="rounded-full bg-indigo-50 p-3 shrink-0">
              <Phone className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Téléphone / WhatsApp</h3>
              <p className="text-sm text-slate-500 mt-1">Du lundi au vendredi, 9h - 18h</p>
              <p className="text-sm font-medium text-slate-700 mt-1">+242 06 442 60 75</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
            <div className="rounded-full bg-indigo-50 p-3 shrink-0">
              <MapPin className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Bureau</h3>
              <p className="text-sm text-slate-500 mt-1">Brazzaville, République du Congo</p>
              <p className="text-sm font-medium text-slate-700 mt-1">Talangai, Texaco</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}