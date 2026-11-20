# OMBRELLE Academy

Plateforme EdTech interactive et gamifiée (Next.js 14 + Supabase), mobile-first, en français.
Cahier des charges : formations BRVM, Investissement & Crypto, E-commerce & Mobile Money.

## Démarrage rapide

1. **Supabase** : crée un projet, puis exécute dans l'éditeur SQL (ou `supabase db push`), dans l'ordre :
   `supabase/migrations/0001_schema.sql` → `0002_logic.sql` → `0003_rls_storage.sql` → `0004_reference_data.sql`,
   puis (optionnel, démo) `supabase/seed.sql`.
2. **Auth** : Authentication → URL Configuration → ajoute `http://localhost:3000/auth/callback` (et l'URL de prod) aux Redirect URLs.
3. `cp .env.example .env.local` et renseigne `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. `npm install && npm run dev` → http://localhost:3000
5. **Premier superadmin** : crée un compte via /inscription, puis dans l'éditeur SQL :
   `update public.profiles set role = 'superadmin' where email = 'toi@exemple.com';`
   (seul moyen volontaire : un utilisateur ne peut jamais changer son propre rôle).

Déploiement : Vercel (frontend) + Supabase. Aucune clé secrète n'est utilisée côté frontend (seule la clé `anon`).

## Architecture

- **Toute la logique sensible est dans PostgreSQL** (fonctions `SECURITY DEFINER`, appelées via `supabase.rpc`) :
  correction des quiz, XP, niveaux, badges, séries, progression, inscriptions, validation des paiements.
  Le client n'a **aucun droit d'écriture** sur XP, tentatives, progression, inscriptions, paiements (RLS sans politique d'écriture).
- `question_options.is_correct` n'est jamais lisible par un étudiant : le quiz est servi par `get_activity_for_play` (sans bonnes réponses) et corrigé par `submit_activity`.
- XP idempotents (`xp_transactions.idempotency_key` unique) : pas de farm possible ; 1ʳᵉ réussite d'une activité = XP, bonus « parfait » une seule fois.
- Les paramètres (XP par action, niveaux, badges, intervalles de révision, seuil de réussite) sont des **données** (`xp_rules`, `levels`, `badges`, `app_settings`).
- Un seul contenu pour les 3 modes d'apprentissage (`enrollments.learning_mode`) ; un mode ne duplique jamais le contenu.
- Écarts assumés par rapport au cahier des charges :
  - la banque de questions est la table `questions` (liée aux quiz via `activity_questions`) au lieu de deux tables `questions` + `question_bank` ;
  - les « Edge Functions » sont remplacées par des RPC Postgres (même rôle, moins de latence, transactionnel) ;
  - shadcn/ui non utilisé : composants Tailwind maison (classes `btn`, `card`, `input` dans `globals.css`).

## Tests

`supabase/tests/*.sql` : scénarios exécutables sur un Postgres local (`00_local_stub.sql` simule `auth`/`storage` de Supabase) :
inscription, accès aux leçons, non-fuite des bonnes réponses, XP idempotent, protection du rôle, accès refusé aux formations non payées.
Ces scénarios ont été exécutés avec succès (voir STATUS.md).

Voir **STATUS.md** pour ce qui est fait / reste à faire.
