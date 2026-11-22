import { Lock } from "lucide-react";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-start gap-4">
        <div className="rounded-lg bg-indigo-50 p-3">
          <Lock className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Politique de Confidentialité</h1>
          <p className="text-sm text-slate-500 mt-2">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
        
        <p className="lead text-lg text-slate-700">
          Chez OMBRELLE Academy (ZALATECH), la protection de vos données personnelles est une priorité. 
          Cette politique explique quelles données nous collectons, pourquoi, et comment nous les protégeons.
        </p>

        <h2>1. Responsable du Traitement</h2>
        <p>
          Le responsable du traitement des données est la société ZALATECH, éditeur de la plateforme OMBRELLE Academy. 
          Pour toute question relative à vos données, vous pouvez nous contacter à l'adresse : <strong>contact@zalatech.net</strong>.
        </p>

        <h2>2. Données Collectées</h2>
        <p>Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme :</p>
        <ul>
          <li><strong>Données d'identification :</strong> Nom complet, adresse email, numéro de téléphone, pays.</li>
          <li><strong>Données de progression :</strong> Leçons terminées, résultats des quiz, XP, badges obtenus.</li>
          <li><strong>Données de paiement :</strong> Historique des transactions, preuves de paiement (captures d'écran Mobile Money). <em>Note : Nous ne stockons jamais vos codes PIN ou identifiants bancaires.</em></li>
          <li><strong>Données techniques :</strong> Adresse IP, logs de connexion, type d'appareil.</li>
        </ul>

        <h2>3. Finalités du Traitement</h2>
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>Gérer votre compte et votre authentification.</li>
          <li>Assurer le suivi de votre progression pédagogique et vous attribuer vos XP/Badges.</li>
          <li>Vérifier et valider vos paiements (par nos administrateurs).</li>
          <li>Vous envoyer des emails transactionnels (confirmation de compte, réinitialisation de mot de passe, alertes de paiement).</li>
          <li>Améliorer nos formations via des statistiques anonymisées.</li>
        </ul>

        <h2>4. Durée de Conservation</h2>
        <p>
          Vos données de compte sont conservées tant que votre compte est actif. 
          En cas d'inactivité prolongée (plus de 3 ans) ou de suppression de votre compte, vos données personnelles seront effacées, à l'exception des données de facturation/paiement qui doivent être conservées pendant 10 ans pour des raisons légales et comptables.
        </p>

        <h2>5. Partage des Données</h2>
        <p>
          Vos données ne sont <strong>jamais vendues</strong> à des tiers. Elles sont uniquement partagées avec nos sous-traitants techniques :
        </p>
        <ul>
          <li><strong>Supabase :</strong> pour le stockage sécurisé de la base de données et l'authentification.</li>
          <li><strong>Vercel :</strong> pour l'hébergement du site web.</li>
          <li><strong>Brevo :</strong> pour l'envoi des emails transactionnels.</li>
        </ul>

        <h2>6. Vos Droits</h2>
        <p>
          Conformément à la réglementation sur la protection des données, vous disposez des droits suivants :
        </p>
        <ul>
          <li><strong>Droit d'accès :</strong> obtenir une copie de vos données.</li>
          <li><strong>Droit de rectification :</strong> modifier vos informations depuis votre profil ou en nous contactant.</li>
          <li><strong>Droit à l'effacement :</strong> demander la suppression de votre compte et de vos données.</li>
          <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format lisible.</li>
        </ul>
        <p>Pour exercer ces droits, écrivez-nous à <strong>contact@zalatech.net</strong>.</p>

        <h2>7. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles avancées (chiffrement des mots de passe, protocoles HTTPS, politiques d'accès strictes via RLS) pour protéger vos données contre tout accès non autorisé.
        </p>
      </div>
    </div>
  );
}