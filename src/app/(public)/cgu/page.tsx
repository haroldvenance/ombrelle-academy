import { Scale } from "lucide-react";

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-start gap-4">
        <div className="rounded-lg bg-slate-100 p-3">
          <Scale className="h-6 w-6 text-slate-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conditions Générales d'Utilisation</h1>
          <p className="text-sm text-slate-500 mt-1">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-indigo-600">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-8">
          <p className="text-sm text-amber-800 m-0">
            <strong>Note :</strong> Ce document est un modèle provisoire. Il doit être complété et validé par un juriste avant la mise en production officielle de la plateforme.
          </p>
        </div>

        <h2>1. Objet</h2>
        <p>Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation de la plateforme OMBRELLE Academy.</p>
        
        <h2>2. Accès au service</h2>
        <p>L'accès à la plateforme nécessite la création d'un compte utilisateur. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants.</p>
        
        <h2>3. Contenu et Propriété Intellectuelle</h2>
        <p>[À COMPLÉTER : Mentions relatives aux droits d'auteur sur les formations, les textes et les exercices].</p>
        
        <h2>4. Paiements et Remboursements</h2>
        <p>[À COMPLÉTER : Politique de paiement, conditions de remboursement, gestion des paiements fractionnés].</p>

        <h2>5. Responsabilité</h2>
        <p>[À COMPLÉTER : Limites de responsabilité concernant les conseils financiers prodigués dans les formations].</p>
      </div>
    </div>
  );
}