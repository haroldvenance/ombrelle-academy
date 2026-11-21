-- =====================================================================
-- OMBRELLE Academy — 0001_schema.sql : tables, contraintes, index
-- Corrections intégrées :
--   - cover_image → cover_url (aligné sur le code)
--   - UNIQUE (parent, position) sur modules/lessons/activités/activity_questions
--   - UNIQUE (user_id, activity_id, attempt_number) sur activity_attempts
--   - UNIQUE (attempt_id, question_id) sur question_responses
--   - payments.user_id et payments.enrollment_id nullable (on delete set null)
--     → permet delete_own_account sans perdre l'audit financier
--   - CHECK sur review_items.status, notifications.type, payments.payment_method
--   - CHECK xp_transactions.amount <> 0 (autorise les corrections négatives)
--   - activity_attempts.xp_awarded (traçabilité)
--   - Timezone par défaut : Africa/Brazzaville
--   - Index notifications non-lues
-- =====================================================================
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- Utilisateurs ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, username text unique, email text, phone text, avatar_url text, country text,
  role text not null default 'student' check (role in ('student','instructor','admin','superadmin')),
  bio text,
  timezone text not null default 'Africa/Brazzaville',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  learning_mode_default text not null default 'classic' check (learning_mode_default in ('classic','interactive','intensive')),
  notifications_enabled boolean not null default true,
  email_notifications boolean not null default true,
  leaderboard_visibility boolean not null default true,
  reminder_frequency text not null default 'weekly' check (reminder_frequency in ('none','daily','weekly')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  email_enabled boolean not null default true, push_enabled boolean not null default false,
  reminders_enabled boolean not null default true, frequency text not null default 'weekly',
  quiet_hours jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ---------- Contenu pédagogique ----------
create table public.formations (
  id uuid primary key default gen_random_uuid(),
  title text not null, slug text not null unique, description text,
  objectives jsonb not null default '[]', skills jsonb not null default '[]',
  cover_url text,
  category text,
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  duration_days integer, price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'XAF',
  allow_partial_access boolean not null default false,
  learning_modes_config jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.formation_modules (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations(id) on delete cascade,
  title text not null, description text, position integer not null default 0,
  is_required boolean not null default true, unlock_rule jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint fm_unique_position unique (formation_id, position)
);
create index on public.formation_modules(formation_id, position);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.formation_modules(id) on delete cascade,
  title text not null, slug text not null, description text,
  content jsonb not null default '[]',
  position integer not null default 0, estimated_duration integer,
  xp_reward integer not null default 20 check (xp_reward >= 0),
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  version integer not null default 1,
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (module_id, slug),
  constraint lessons_unique_position unique (module_id, position)
);
create index on public.lessons(module_id, position);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations(id) on delete cascade,
  module_id uuid references public.formation_modules(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null, description text,
  type text not null default 'quiz' check (type in (
    'quiz','true_false','multiple_choice','single_choice','matching','sorting',
    'fill_blank','challenge','simulation','exercise','memory'
  )),
  configuration jsonb not null default '{}',
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  xp_reward integer not null default 50 check (xp_reward >= 0),
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint activities_unique_position unique (formation_id, position)
);
create index on public.activities(formation_id);
create index on public.activities(lesson_id);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid references public.formations(id) on delete cascade,
  module_id uuid references public.formation_modules(id) on delete set null,
  question_text text not null,
  question_type text not null default 'single_choice' check (question_type in ('single_choice','multiple_choice','true_false')),
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  explanation text, points integer not null default 10 check (points >= 0),
  media_url text, tags text[] not null default '{}',
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.questions(formation_id);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null, is_correct boolean not null default false,
  feedback text, position integer not null default 0
);
create index on public.question_options(question_id);

create table public.activity_questions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position integer not null default 0, points_override integer,
  unique (activity_id, question_id),
  constraint actq_unique_position unique (activity_id, position)
);

-- ---------- Inscriptions & paiements ----------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  formation_id uuid not null references public.formations(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','active','suspended','completed','cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending','partially_paid','paid','failed','refunded')),
  learning_mode text not null default 'classic' check (learning_mode in ('classic','interactive','intensive')),
  enrolled_at timestamptz not null default now(), completed_at timestamptz, expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index enrollments_one_open on public.enrollments(user_id, formation_id) where status <> 'cancelled';
create index on public.enrollments(user_id);
create index on public.enrollments(formation_id);

create table public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations(id) on delete cascade,
  name text not null, total_amount numeric(12,2) not null check (total_amount >= 0),
  currency text not null default 'XAF', installment_count integer not null default 1,
  configuration jsonb not null default '{}', is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- payments : user_id et enrollment_id nullable (on delete set null)
-- → permet delete_own_account() en conservant l'audit financier anonymisé.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0), currency text not null default 'XAF',
  payment_method text not null check (payment_method in ('orange_money','mtn_momo','bank_transfer','cash','other')),
  transaction_reference text not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  proof_url text, paid_on date,
  verified_by uuid references public.profiles(id) on delete set null, verified_at timestamptz,
  admin_comment text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index payments_unique_ref on public.payments(lower(payment_method), lower(transaction_reference)) where status <> 'failed';
create index on public.payments(enrollment_id);
create index on public.payments(user_id);

create table public.payment_installments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  installment_number integer not null, amount numeric(12,2) not null check (amount > 0),
  due_date date, status text not null default 'pending' check (status in ('pending','paid','overdue')),
  paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (enrollment_id, installment_number)
);

-- ---------- Progression ----------
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  status text not null default 'in_progress' check (status in ('not_started','in_progress','completed','mastered')),
  started_at timestamptz default now(), completed_at timestamptz,
  last_position jsonb, attempts integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.formation_modules(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  progress_percentage numeric(5,1) not null default 0,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table public.activity_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  attempt_number integer not null default 1, answers jsonb,
  score numeric(8,2) not null default 0, max_score numeric(8,2) not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress','passed','failed')),
  xp_awarded integer not null default 0,
  started_at timestamptz not null default now(), completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint attempts_unique unique (user_id, activity_id, attempt_number)
);
create index on public.activity_attempts(user_id, activity_id);

create table public.question_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.activity_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_options jsonb not null default '[]', is_correct boolean not null default false,
  points_awarded numeric(8,2) not null default 0, response_time integer,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
create index on public.question_responses(question_id);

-- ---------- Gamification ----------
create table public.levels (
  id uuid primary key default gen_random_uuid(),
  level_number integer not null unique, name text not null, required_xp integer not null default 0, icon text,
  created_at timestamptz not null default now()
);

create table public.xp_rules (
  action text primary key, amount integer not null check (amount >= 0), description text
);

create table public.app_settings (key text primary key, value jsonb not null);

create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null,
  source_type text, source_id uuid, formation_id uuid,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index on public.xp_transactions(user_id, created_at);
create index on public.xp_transactions(formation_id);

create table public.user_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp integer not null default 0, level_number integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, description text, icon_url text,
  condition_type text not null, condition_config jsonb not null default '{}',
  rarity text not null default 'common', is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(), metadata jsonb not null default '{}',
  unique (user_id, badge_id)
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid references public.formations(id) on delete cascade,
  title text not null, description text, difficulty text not null default 'medium',
  xp_reward integer not null default 300, badge_reward_id uuid references public.badges(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  start_at timestamptz, end_at timestamptz, created_at timestamptz not null default now()
);
create table public.quest_tasks (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  title text not null, description text, task_type text not null default 'complete_lesson',
  target_type text, target_id uuid, target_value jsonb not null default '{}', position integer not null default 0
);
create table public.user_quest_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  started_at timestamptz not null default now(), completed_at timestamptz,
  unique (user_id, quest_id)
);
create table public.quest_task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_task_id uuid not null references public.quest_tasks(id) on delete cascade,
  current_value jsonb not null default '{}', completed boolean not null default false, completed_at timestamptz,
  unique (user_id, quest_task_id)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  challenge_type text not null default 'daily' check (challenge_type in ('daily','weekly','formation','individual','collective')),
  formation_id uuid references public.formations(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  difficulty text not null default 'medium', xp_reward integer not null default 100,
  start_at timestamptz, end_at timestamptz, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.challenge_participations (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(8,2) not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  started_at timestamptz not null default now(), completed_at timestamptz,
  unique (challenge_id, user_id)
);

create table public.user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  current_streak integer not null default 0, longest_streak integer not null default 0,
  last_activity_date date, protected_days integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_type text not null, period_start date, period_end date,
  formation_id uuid references public.formations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0, rank integer not null, generated_at timestamptz not null default now()
);
create index on public.leaderboard_snapshots(period_type, period_start, rank);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'badge_earned','level_up','formation_completed','module_completed',
    'enrollment','payment_submitted','payment_verified','payment_rejected',
    'access_granted','challenge_won','quest_completed','system'
  )),
  title text not null, body text, payload jsonb not null default '{}',
  read_at timestamptz, created_at timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  mastery_score numeric(4,1) not null default 0, repetition_count integer not null default 0,
  last_reviewed_at timestamptz, next_review_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','suspended','mastered')),
  unique (user_id, question_id)
);
create index on public.review_items(user_id, next_review_at);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, user_id uuid, payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.events(event_type, created_at);

-- updated_at automatique
do $$ declare t text; begin
  for t in select table_name from information_schema.columns
           where table_schema='public' and column_name='updated_at'
             and table_name in (select tablename from pg_tables where schemaname='public')
  loop
    execute format('create trigger trg_%1$s_updated before update on public.%1$I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;