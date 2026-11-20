const FAQ = [
  ["Comment accéder à une formation ?", "Crée un compte, inscris-toi à la formation, puis effectue le paiement (si elle est payante) et soumets ta preuve. L'accès est activé après validation."],
  ["Comment fonctionne le paiement ?", "Au lancement, le paiement est manuel (Mobile Money, virement). Tu soumets ta référence de transaction et un administrateur la valide."],
  ["À quoi servent les XP ?", "Ils matérialisent ta progression : ils sont gagnés en terminant des leçons et en réussissant des activités, jamais en ouvrant simplement une page."],
  ["Puis-je changer de mode d'apprentissage ?", "Oui, à tout moment depuis la page de ta formation."],
];
export default function Faq() {
  return <div className="max-w-3xl space-y-3"><h1 className="text-3xl font-bold text-brand-900">FAQ</h1>{FAQ.map(([q, a]) => <details key={q} className="card"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm text-slate-600">{a}</p></details>)}</div>;
}
