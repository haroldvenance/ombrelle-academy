-- =====================================================================
-- 0003_rls_storage.sql : Row Level Security + Storage
-- Corrections intégrées :
--   - payments_select : autorise admin même si user_id null (compte supprimé)
--   - lesson-assets : isolation par formation via chemin {formation_id}/...
--   - certificates : policy INSERT admin explicite
-- =====================================================================
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- profiles
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- préférences
create policy settings_own on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifprefs_own on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- formations (catalogue public)
create policy formations_select on public.formations for select using (status = 'published' or public.is_staff());
create policy formations_insert on public.formations for insert with check (public.is_staff());
create policy formations_update on public.formations for update using (public.is_admin() or created_by = auth.uid()) with check (public.is_admin() or created_by = auth.uid());
create policy formations_delete on public.formations for delete using (public.is_admin());

create policy modules_select on public.formation_modules for select
  using (public.is_staff() or exists (select 1 from public.formations f where f.id = formation_id and f.status = 'published'));
create policy modules_staff on public.formation_modules for all using (public.is_staff()) with check (public.is_staff());

create policy lessons_select on public.lessons for select
  using (public.is_staff() or (status = 'published' and exists (
    select 1 from public.formation_modules m where m.id = module_id and public.has_access(m.formation_id))));
create policy lessons_staff on public.lessons for all using (public.is_staff()) with check (public.is_staff());

create policy activities_select on public.activities for select
  using (public.is_staff() or (status = 'published' and public.has_access(formation_id)));
create policy activities_staff on public.activities for all using (public.is_staff()) with check (public.is_staff());

create policy questions_staff on public.questions for all using (public.is_staff()) with check (public.is_staff());
create policy options_staff on public.question_options for all using (public.is_staff()) with check (public.is_staff());
create policy actq_staff on public.activity_questions for all using (public.is_staff()) with check (public.is_staff());

-- inscriptions & paiements
create policy enrollments_select on public.enrollments for select using (user_id = auth.uid() or public.is_staff());
create policy enrollments_admin on public.enrollments for all using (public.is_admin()) with check (public.is_admin());
create policy plans_select on public.payment_plans for select using (is_active or public.is_staff());
create policy plans_admin on public.payment_plans for all using (public.is_admin()) with check (public.is_admin());

-- payments : user_id peut être NULL (compte supprimé) — admin voit tout
create policy payments_select on public.payments for select
  using (user_id = auth.uid() or public.is_admin());

create policy installments_select on public.payment_installments for select
  using (public.is_admin() or exists (select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));
create policy installments_admin on public.payment_installments for all using (public.is_admin()) with check (public.is_admin());

-- progression
create policy lp_select on public.lesson_progress for select using (user_id = auth.uid() or public.is_staff());
create policy mp_select on public.module_progress for select using (user_id = auth.uid() or public.is_staff());
create policy att_select on public.activity_attempts for select using (user_id = auth.uid() or public.is_staff());
create policy resp_select on public.question_responses for select
  using (public.is_staff() or exists (select 1 from public.activity_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- gamification
create policy levels_select on public.levels for select using (true);
create policy levels_admin on public.levels for all using (public.is_admin()) with check (public.is_admin());
create policy xprules_select on public.xp_rules for select using (auth.uid() is not null);
create policy xprules_admin on public.xp_rules for all using (public.is_admin()) with check (public.is_admin());
create policy settings_select on public.app_settings for select using (auth.uid() is not null);
create policy settings_admin on public.app_settings for all using (public.is_admin()) with check (public.is_admin());
create policy xp_select on public.xp_transactions for select using (user_id = auth.uid() or public.is_staff());
create policy stats_select on public.user_stats for select using (user_id = auth.uid() or public.is_staff());
create policy badges_select on public.badges for select using (true);
create policy badges_admin on public.badges for all using (public.is_admin()) with check (public.is_admin());
create policy ubadges_select on public.user_badges for select using (user_id = auth.uid() or public.is_staff());
create policy quests_select on public.quests for select using (public.is_staff() or (status = 'published' and (formation_id is null or public.has_access(formation_id))));
create policy quests_admin on public.quests for all using (public.is_admin()) with check (public.is_admin());
create policy qtasks_select on public.quest_tasks for select using (public.is_staff() or exists (select 1 from public.quests q where q.id = quest_id and q.status = 'published'));
create policy qtasks_admin on public.quest_tasks for all using (public.is_admin()) with check (public.is_admin());
create policy uqp_select on public.user_quest_progress for select using (user_id = auth.uid() or public.is_staff());
create policy qtp_select on public.quest_task_progress for select using (user_id = auth.uid() or public.is_staff());
create policy challenges_select on public.challenges for select using (public.is_staff() or (is_active and auth.uid() is not null));
create policy challenges_admin on public.challenges for all using (public.is_admin()) with check (public.is_admin());
create policy chp_select on public.challenge_participations for select using (user_id = auth.uid() or public.is_staff());
create policy streaks_select on public.user_streaks for select using (user_id = auth.uid() or public.is_staff());
create policy lbs_select on public.leaderboard_snapshots for select using (auth.uid() is not null);
create policy notifications_select on public.notifications for select using (user_id = auth.uid());
create policy review_select on public.review_items for select using (user_id = auth.uid() or public.is_staff());
create policy events_select on public.events for select using (public.is_admin());

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true), ('formation-covers', 'formation-covers', true),
  ('lesson-assets', 'lesson-assets', false), ('payment-proofs', 'payment-proofs', false),
  ('certificates', 'certificates', false)
on conflict (id) do nothing;

create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars write own" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars update own" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars delete own" on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers read" on storage.objects for select using (bucket_id = 'formation-covers');
create policy "covers staff write" on storage.objects for all using (bucket_id = 'formation-covers' and public.is_staff()) with check (bucket_id = 'formation-covers' and public.is_staff());

-- lesson-assets : isolation par formation via chemin {formation_id}/{asset}
create policy "assets read enrolled" on storage.objects for select
  using (
    bucket_id = 'lesson-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}'
    and public.has_access(((storage.foldername(name))[1])::uuid)
  );
create policy "assets staff write" on storage.objects for all
  using (bucket_id = 'lesson-assets' and public.is_staff())
  with check (bucket_id = 'lesson-assets' and public.is_staff());

-- proofs
create policy "proofs insert own" on storage.objects for insert with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proofs read own or admin" on storage.objects for select using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- certificates
create policy "certs read own or admin" on storage.objects for select using (bucket_id = 'certificates' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "certs admin insert" on storage.objects for insert with check (bucket_id = 'certificates' and public.is_admin());
create policy "certs admin delete" on storage.objects for delete using (bucket_id = 'certificates' and public.is_admin());