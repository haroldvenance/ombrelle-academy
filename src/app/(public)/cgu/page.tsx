import { Scale } from "lucide-react";

export default function Terms() {
  return (
    <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-start gap-4">
        <div className="rounded-lg bg-indigo-50 p-3">
          <Scale className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Conditions Générales d'Utilisation</h1>
          <p className="text-sm text-slate-500 mt-2">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
        
        <h2>1. Objet et Mentions Légales</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation de la plateforme OMBRELLE Academy, éditée par ZALATECH. 
          En créant un compte, l'utilisateur accepte sans réserve les présentes CGU.
        </p>

        <h2>2. Accès au Service et Compte Utilisateur</h2>
        <p>
          L'accès aux formations nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes, à maintenir la confidentialité de ses identifiants et à ne pas partager son compte.
          Toute activité frauduleuse entraînera la suspension immédiate du compte.
        </p>

        <h2>3. Propriété Intellectuelle</h2>
        <p>
          L'ensemble des contenus (textes, vidéos, quiz, exercices, logos) présents sur la plateforme est la propriété exclusive de ZALATECH. 
          Toute reproduction, revente ou diffusion non autorisée du contenu des formations est strictement interdite et passible de poursuites judiciaires.
        </p>

        <h2>4. Paiements et Remboursements</h2>
        <p>
          Certaines formations sont payantes. Les paiements s'effectuent via Mobile Money ou virement, et sont soumis à validation par notre équipe.
        </p>
        <ul>
          <li><strong>Paiement fractionné :</strong> Lorsque cette option est disponible, l'accès à la formation est conditionné au respect des échéances de paiement.</li>
          <li><strong>Politique de remboursement :</strong> Conformément à la réglementation sur les services numériques, le droit de rétractation ne s'applique pas une fois que l'utilisateur a commencé à accéder au contenu de la formation. Aucun remboursement ne sera effectué après le début du cours.</li>
        </ul>

        <h2>5. Avertissement Financier (Clause de Responsabilité)</h2>
        <p>
          <strong>OMBRELLE Academy est un organisme de formation. Les contenus pédagogiques (notamment sur la BRVM, la crypto-monnaie et l'investissement) sont fournis à titre purement informatif et éducatif.</strong>
        </p>
        <p>
          Ils ne constituent en aucun cas des conseils en investissement, une recommandation d'achat ou de vente, ou une quelconque garantie de rendement. 
          Investir comporte des risques, y compris la perte totale du capital. ZALATECH ne saurait être tenue responsable des décisions financières prises par les utilisateurs à la suite de nos formations.
        </p>

        <h2>6. Sanctions et Résiliation</h2>
        <p>
          En cas de violation des présentes CGU (tentative de triche, usurpation d'identité, non-paiement), ZALATECH se réserve le droit de suspendre ou de supprimer définitivement le compte de l'utilisateur sans préavis ni remboursement.
        </p>

        <h2>7. Droit Applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit en vigueur en Côte d'Ivoire (UEMOA). Tout litige relèvera de la compétence exclusive des tribunaux d'Abidjan.
        </p>
      </div>
    </div>
  );
}