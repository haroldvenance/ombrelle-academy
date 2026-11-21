import { HelpCircle, ChevronDown } from "lucide-react";

const FAQ = [
  {
    q: "Comment accéder à une formation ?",
    a: "Créez un compte, inscrivez-vous à la formation. Si elle est payante, effectuez le paiement Mobile Money et soumettez votre preuve. L'accès est débloqué dès validation par un administrateur."
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: "Nous utilisons un système de paiement manuel sécurisé. Vous effectuez le transfert vers notre compte marchand, puis vous soumettez la référence de transaction sur votre tableau de bord."
  },
  {
    q: "À quoi servent les XP ?",
    a: "Les XP (points d'expérience) matérialisent votre progression. Ils sont gagnés en terminant des leçons et en réussissant des quiz. Ils vous permettent de monter de niveau, de débloquer des badges et de figurer dans le classement."
  },
  {
    q: "Puis-je changer de mode d'apprentissage ?",
    a: "Oui, à tout moment depuis la page de votre formation. Vous pouvez basculer entre le mode Classique, Interactif ou Intensif selon votre rythme."
  },
  {
    q: "Que faire si mon paiement est refusé ?",
    a: "Si votre preuve de paiement est refusée, un motif vous sera communiqué sur votre tableau de bord. Vous pourrez soumettre une nouvelle preuve corrigée."
  }
];

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-full mb-4">
          <HelpCircle className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Foire aux questions</h1>
        <p className="text-slate-500 mt-2">Trouvez rapidement des réponses à vos questions.</p>
      </div>

      <div className="space-y-3">
        {FAQ.map((item, i) => (
          <details key={i} className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between p-5 font-medium text-slate-900 hover:bg-slate-50 transition-colors">
              {item.q}
              <ChevronDown className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <div className="px-5 pb-5 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
              <div className="pt-4">{item.a}</div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}