import { Lock } from "lucide-react";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-start gap-4">
        <div className="rounded-lg bg-slate-100 p-3">
          <Lock className="h-6 w-6 text-slate-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Politique de Confidentialité</h1>
          <p className="text-sm text-slate-500 mt-1">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none prose-headings:font-semibold">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-8">
          <p className="text-sm text-amber-800 m-0">
            <strong>Note :</strong> Ce document doit être validé par un juriste pour garantir la conformité avec le RGPD et les lois locales de protection des données.
          </p>
        </div>

        <h2>1. Données collectées</h2>
        <p>Nous collectons les données suivantes : nom, adresse email, numéro de téléphone, pays, progression dans les cours, et preuves de paiement (captures d'écran Mobile Money).</p>

        <h2>2. Finalités du traitement</h2>
        <p>Vos données sont utilisées pour : la gestion de votre compte, le suivi de votre progression, la validation des paiements, et l'envoi de notifications relatives à vos formations.</p>

        <h2>3. Durée de conservation</h2>
        <p>[À COMPLÉTER : Durée de conservation des données de compte, des preuves de paiement et des logs de connexion].</p>

        <h2>4. Vos droits</h2>
        <p>Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour exercer ces droits, contactez-nous.</p>
      </div>
    </div>
  );
}