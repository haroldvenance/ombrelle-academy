# STATUS — état d'avancement

## Livré et vérifié
- `npx tsc --noEmit` : OK. `next build` : OK (31 routes).
- Migrations SQL exécutées sur un Postgres 16 local (avec stub Supabase) : OK. Seed OK.
- Tests de logique/sécurité SQL : inscription gratuite, accès conditionné à l'inscription, `is_correct` non lisible, leçon terminée (+20 XP) puis idempotente (0 XP), quiz corrigé côté serveur (+75 XP : 50 + bonus 25), re-soumission = 0 XP, écriture directe `user_stats` / `xp_transactions` refusée, changement de rôle ignoré, formation payante inaccessible sans validation, RPC admin refusées aux étudiants.

## MVP (P0/P1) — implémenté
Auth (inscription, connexion, reset mot de passe, callback), profils & paramètres, catalogue + filtres, page formation, inscription (+ choix du mode), paiement manuel (preuve en bucket privé, validation/refus admin, paiement fractionné partiel via `allow_partial_access`), dashboard étudiant (niveau, XP, série, mission du jour, progression, badges, révisions dues), parcours cours → leçon → quiz, progression leçon/module/formation calculée serveur, XP/niveaux/badges/séries, classement (général/semaine/mois/formation, respect de la visibilité), notifications internes, admin : dashboard stats, formations (CRUD, publier), modules (ordre), leçons (éditeur de blocs + prévisualisation + version simplifiée), activités/quiz (config seuil, tentatives, mélange), banque de questions, étudiants (suspension, accès manuel, rôles superadmin), paiements, stats « questions les plus ratées ». Rôles `instructor` : mêmes droits d'écriture contenu que staff (pas de restriction par formation).

## Schéma prêt mais SANS interface / logique complète (V2+)
- Quêtes (`quests`, `quest_tasks`, progress) et défis (`challenges`) : tables + RLS, pas d'UI ni de moteur d'évaluation.
- Page de révision espacée : `review_items` est alimentée à chaque quiz (intervalles configurables) et le dashboard affiche le nombre de révisions dues, mais il n'y a pas encore de session de révision.
- Types d'activité hors choix (matching, sorting, fill_blank, memory, simulation, exercise) : présents dans le schéma, le lecteur ne gère que choix unique/multiple/vrai-faux.
- Sélection aléatoire de N questions (`question_count`) non gérée (mélange oui).
- Classements en cache (`leaderboard_snapshots`), équipes.

## Non fait / à faire avant production
- Emails transactionnels (confirmation, paiement validé…) : seuls les emails Auth Supabase existent. À brancher (Resend + Edge Function / Database Webhook).
- Notifications push, PWA, certificats PDF, IA pédagogique (V3/V4).
- Upload d'images (couvertures, avatars, assets de leçon) depuis l'admin : les buckets et policies existent, l'UI utilise des URL.
- Plans de paiement/échéances (`payment_plans`, `payment_installments`) : tables + marquage automatique à la validation, sans écran de configuration.
- Instructeur limité à « ses » formations (actuellement tout le staff écrit partout).
- Contact (formulaire), CGU et confidentialité : textes provisoires à faire valider.
- Tests automatisés front (unitaires/E2E) ; rate limiting ; monitoring ; sauvegardes (à activer côté Supabase).
- Le front n'a pas été testé contre un vrai projet Supabase (non disponible ici) : prévoir une passe de recette manuelle (embeds PostgREST, upload de preuve, e-mails).
- Décisions ouvertes du §39 (accès à durée limitée, XP global vs par formation, etc.) : choix par défaut = XP global + XP filtrable par formation, accès permanent.
