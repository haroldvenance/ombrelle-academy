-- =====================================================================
-- 0007_rls_instructor_isolation.sql
-- Isolation stricte des instructeurs sur les ressources pédagogiques.
-- Corrections intégrées :
--   - owns_formation / can_manage_* inchangés (déjà OK)
--   - ajout grant execute sur helpers pour authenticated
--   - commentaire sur la migration cover_image → cover_url
-- =====================================================================

create or replace function public.owns_formation(p_formation uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.formations
    where id = p_formation and created_by = auth.uid()
  )
$$;

create or replace function public.can_manage_formation(p_formation uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or (public.is_staff() and public.owns_formation(p_formation))
$$;

create or replace function public.can_manage_module(p_module uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.formation_modules m
    join public.formations f on f.id = m.formation_id
    where m.id = p_module
      and (public.is_admin() or (public.is_staff() and f.created_by = auth.uid()))
  )
$$;

create or replace function public.can_manage_lesson(p_lesson uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lessons l
    join public.formation_modules m on m.id = l.module_id
    join public.formations f on f.id = m.formation_id
    where l.id = p_lesson
      and (public.is_admin() or (public.is_staff() and f.created_by = auth.uid()))
  )
$$;

create or replace function public.can_manage_activity(p_activity uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.activities a
    join public.formations f on f.id = a.formation_id
    where a.id = p_activity
      and (public.is_admin() or (public.is_staff() and f.created_by = auth.uid()))
  )
$$;

create or replace function public.can_manage_question(p_question uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1
    from public.questions q
    left join public.formations f on f.id = q.formation_id
    where q.id = p_question
      and public.is_staff()
      and (q.created_by = auth.uid() or f.created_by = auth.uid())
  )
$$;

grant execute on function
  public.owns_formation(uuid),
  public.can_manage_formation(uuid),
  public.can_manage_module(uuid),
  public.can_manage_lesson(uuid),
  public.can_manage_activity(uuid),
  public.can_manage_question(uuid)
  to authenticated;

-- Suppression des policies permissives de 0003
drop policy if exists formations_insert  on public.formations;
drop policy if exists modules_staff     on public.formation_modules;
drop policy if exists lessons_staff     on public.lessons;
drop policy if exists activities_staff  on public.activities;
drop policy if exists questions_staff   on public.questions;
drop policy if exists options_staff     on public.question_options;
drop policy if exists actq_staff        on public.activity_questions;

create policy formations_insert on public.formations for insert
  with check (public.is_staff() and created_by = auth.uid());

create policy modules_staff on public.formation_modules for all
  using (public.can_manage_formation(formation_id))
  with check (public.can_manage_formation(formation_id));

create policy lessons_staff on public.lessons for all
  using (public.can_manage_module(module_id))
  with check (public.can_manage_module(module_id));

create policy activities_staff on public.activities for all
  using (public.can_manage_formation(formation_id))
  with check (public.can_manage_formation(formation_id));

create policy questions_select on public.questions for select
  using (public.is_staff());

create policy questions_insert on public.questions for insert
  with check (
    public.is_admin()
    or (
      public.is_staff()
      and formation_id is not null
      and public.can_manage_formation(formation_id)
    )
    or (
      public.is_staff()
      and formation_id is null
      and created_by = auth.uid()
    )
  );

create policy questions_update on public.questions for update
  using (public.can_manage_question(id))
  with check (public.can_manage_question(id));

create policy questions_delete on public.questions for delete
  using (public.can_manage_question(id));

create policy options_select on public.question_options for select
  using (public.is_staff());

create policy options_insert on public.question_options for insert
  with check (public.can_manage_question(question_id));

create policy options_update on public.question_options for update
  using (public.can_manage_question(question_id))
  with check (public.can_manage_question(question_id));

create policy options_delete on public.question_options for delete
  using (public.can_manage_question(question_id));

create policy actq_select on public.activity_questions for select
  using (public.is_staff());

create policy actq_insert on public.activity_questions for insert
  with check (public.can_manage_activity(activity_id));

create policy actq_update on public.activity_questions for update
  using (public.can_manage_activity(activity_id))
  with check (public.can_manage_activity(activity_id));

create policy actq_delete on public.activity_questions for delete
  using (public.can_manage_activity(activity_id));

-- Remédiation : formations orphelines rattachées au premier admin
-- (à décommenter après une migration si nécessaire)
--
-- update public.formations
--    set created_by = (
--      select id from public.profiles
--      where role in ('admin','superadmin')
--      order by created_at limit 1
--    )
--  where created_by is null;