-- =====================================================================
-- 0002_logic.sql : helpers, moteur de récompenses, RPC serveur
-- Toute la logique sensible (XP, correction, progression, paiements)
-- s'exécute ici, en SECURITY DEFINER. Le client ne peut jamais écrire
-- directement XP, score, progression, rôle ou statut d'accès.
-- =====================================================================

-- ---------- Helpers de rôles / accès ----------
create or replace function public.current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('instructor','admin','superadmin'), false) $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('admin','superadmin'), false) $$;

create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'superadmin', false) $$;

create or replace function public.has_access(p_formation uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or (
    not coalesce((select is_suspended from public.profiles where id = auth.uid()), false)
    and exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid() and e.formation_id = p_formation
        and e.status in ('active','completed')
        and (e.expires_at is null or e.expires_at > now())
    )
  ) $$;

-- ---------- Création de profil à l'inscription ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, username)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          'user_' || substr(replace(new.id::text,'-',''),1,8))
  on conflict (id) do nothing;
  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  insert into public.notification_preferences (user_id) values (new.id) on conflict do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict do nothing;
  insert into public.user_streaks (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un utilisateur ne peut jamais modifier son rôle / suspension
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.bypass_profile_guard', true), '') = '1' then return new; end if;
  if auth.uid() is not null then
    new.role := old.role;
    new.is_suspended := old.is_suspended;
    new.id := old.id;
  end if;
  return new;
end $$;
create trigger trg_profiles_protect before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------- Journal d'événements ----------
create or replace function public.log_event(p_type text, p_user uuid, p_payload jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into public.events(event_type, user_id, payload) values (p_type, p_user, p_payload) $$;

create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text default null, p_payload jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, type, title, body, payload) values (p_user, p_type, p_title, p_body, p_payload) $$;

create or replace function public.xp_rule(p_action text, p_default int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select amount from public.xp_rules where action = p_action), p_default) $$;

-- ---------- Séries ----------
create or replace function public.touch_streak(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare tz text; v_today date; s public.user_streaks%rowtype; v_new int;
begin
  select timezone into tz from public.profiles where id = p_user;
  begin v_today := (now() at time zone coalesce(tz,'UTC'))::date;
  exception when others then v_today := (now() at time zone 'UTC')::date; end;
  insert into public.user_streaks(user_id) values (p_user) on conflict do nothing;
  select * into s from public.user_streaks where user_id = p_user;
  if s.last_activity_date = v_today then return; end if;
  if s.last_activity_date = v_today - 1 then v_new := s.current_streak + 1;
  elsif s.last_activity_date = v_today - 2 and s.protected_days > 0 then
    v_new := s.current_streak + 1;
    update public.user_streaks set protected_days = protected_days - 1 where user_id = p_user;
  else v_new := 1; end if;
  update public.user_streaks set current_streak = v_new, longest_streak = greatest(longest_streak, v_new),
         last_activity_date = v_today, updated_at = now() where user_id = p_user;
end $$;

-- ---------- Badges ----------
create or replace function public.check_badges(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b record; v_val int; v_ok boolean; v_need int;
begin
  for b in select * from public.badges bd where bd.is_active
           and not exists (select 1 from public.user_badges ub where ub.user_id = p_user and ub.badge_id = bd.id)
  loop
    v_ok := false; v_need := coalesce((b.condition_config->>'count')::int, 1);
    if b.condition_type = 'lessons_completed' then
      select count(*) into v_val from public.lesson_progress where user_id = p_user and status in ('completed','mastered');
      v_ok := v_val >= v_need;
    elsif b.condition_type = 'quizzes_passed' then
      select count(distinct activity_id) into v_val from public.activity_attempts where user_id = p_user and status = 'passed';
      v_ok := v_val >= v_need;
    elsif b.condition_type = 'perfect_quiz' then
      v_ok := exists (select 1 from public.activity_attempts where user_id = p_user and max_score > 0 and score = max_score);
    elsif b.condition_type = 'streak_days' then
      select coalesce(longest_streak,0) into v_val from public.user_streaks where user_id = p_user;
      v_ok := coalesce(v_val,0) >= v_need;
    elsif b.condition_type = 'challenges_completed' then
      select count(*) into v_val from public.challenge_participations where user_id = p_user and status = 'completed';
      v_ok := v_val >= v_need;
    elsif b.condition_type = 'formation_completed' then
      select count(*) into v_val from public.enrollments where user_id = p_user and status = 'completed';
      v_ok := v_val >= v_need;
    end if;
    if v_ok then
      insert into public.user_badges(user_id, badge_id) values (p_user, b.id) on conflict do nothing;
      perform public.notify(p_user, 'badge_earned', 'Badge obtenu : ' || b.name, b.description, jsonb_build_object('badge_id', b.id));
      perform public.log_event('BADGE_EARNED', p_user, jsonb_build_object('badge', b.slug));
    end if;
  end loop;
end $$;

-- ---------- Moteur d'XP (idempotent) ----------
create or replace function public.award_xp(p_user uuid, p_amount int, p_reason text, p_source_type text,
                                           p_source_id uuid, p_key text, p_formation uuid default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_total int; v_old int; v_new int;
begin
  if p_amount is null or p_amount <= 0 then return false; end if;
  insert into public.user_stats(user_id) values (p_user) on conflict do nothing;
  insert into public.xp_transactions(user_id, amount, reason, source_type, source_id, formation_id, idempotency_key)
  values (p_user, p_amount, p_reason, p_source_type, p_source_id, p_formation, p_key)
  on conflict (idempotency_key) do nothing returning id into v_id;
  if v_id is null then return false; end if;
  select level_number into v_old from public.user_stats where user_id = p_user;
  update public.user_stats set total_xp = total_xp + p_amount, updated_at = now()
   where user_id = p_user returning total_xp into v_total;
  select coalesce(max(level_number),1) into v_new from public.levels where required_xp <= v_total;
  update public.user_stats set level_number = v_new where user_id = p_user;
  if v_new > coalesce(v_old,1) then
    perform public.notify(p_user, 'level_up', 'Niveau supérieur !', 'Tu viens d''atteindre le niveau ' || v_new, jsonb_build_object('level', v_new));
    perform public.log_event('LEVEL_UP', p_user, jsonb_build_object('level', v_new));
  end if;
  perform public.check_badges(p_user);
  return true;
end $$;

-- ---------- Révision espacée ----------
create or replace function public.update_review_item(p_user uuid, p_question uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_old numeric; v_m numeric; v_days int; v_cfg jsonb;
begin
  select value into v_cfg from public.app_settings where key = 'review_intervals';
  select mastery_score into v_old from public.review_items where user_id = p_user and question_id = p_question;
  v_m := case when p_ok then least(coalesce(v_old,0) + 1, 4) else 0 end;
  v_days := coalesce((v_cfg->>(v_m::int)::text)::int, case v_m::int when 0 then 1 when 1 then 2 when 2 then 5 when 3 then 14 else 30 end);
  insert into public.review_items(user_id, question_id, mastery_score, repetition_count, last_reviewed_at, next_review_at)
  values (p_user, p_question, v_m, 1, now(), now() + make_interval(days => v_days))
  on conflict (user_id, question_id) do update
    set mastery_score = v_m, repetition_count = public.review_items.repetition_count + 1,
        last_reviewed_at = now(), next_review_at = now() + make_interval(days => v_days);
end $$;

-- ---------- Progression ----------
create or replace function public.recompute_progress(p_user uuid, p_formation uuid) returns void
language plpgsql security definer set search_path = public as $$
declare m record; v_total int; v_done int; v_enr uuid; v_pct numeric; v_prev text;
        v_all boolean := true; v_any boolean := false; v_complete boolean; v_status text;
begin
  select id into v_enr from public.enrollments
   where user_id = p_user and formation_id = p_formation and status in ('active','completed')
   order by enrolled_at desc limit 1;
  if v_enr is null then return; end if;
  for m in select id, is_required from public.formation_modules where formation_id = p_formation loop
    select count(*) into v_total from public.lessons l where l.module_id = m.id and l.status = 'published';
    select count(*) into v_done from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id
     where lp.user_id = p_user and l.module_id = m.id and l.status = 'published' and lp.status in ('completed','mastered');
    v_complete := v_total > 0 and v_done >= v_total;
    v_pct := case when v_total = 0 then 0 else round(v_done::numeric * 100 / v_total, 1) end;
    v_status := case when v_complete then 'completed' when v_done > 0 then 'in_progress' else 'not_started' end;
    select status into v_prev from public.module_progress where user_id = p_user and module_id = m.id;
    insert into public.module_progress(user_id, module_id, enrollment_id, progress_percentage, status, completed_at)
    values (p_user, m.id, v_enr, v_pct, v_status, case when v_complete then now() end)
    on conflict (user_id, module_id) do update
      set progress_percentage = excluded.progress_percentage, status = excluded.status,
          enrollment_id = excluded.enrollment_id,
          completed_at = coalesce(public.module_progress.completed_at, excluded.completed_at);
    if v_total > 0 then v_any := true; end if;
    if v_complete and coalesce(v_prev,'') <> 'completed' then
      perform public.award_xp(p_user, public.xp_rule('module_completed',150), 'Module terminé', 'module', m.id, 'module:' || p_user || ':' || m.id, p_formation);
      perform public.log_event('MODULE_COMPLETED', p_user, jsonb_build_object('module_id', m.id));
    end if;
    if m.is_required and v_total > 0 and not v_complete then v_all := false; end if;
  end loop;
  if v_any and v_all then
    update public.enrollments set status = 'completed', completed_at = now() where id = v_enr and status = 'active';
    if found then
      perform public.award_xp(p_user, public.xp_rule('formation_completed',500), 'Formation terminée', 'formation', p_formation, 'formation:' || p_user || ':' || p_formation, p_formation);
      perform public.notify(p_user, 'formation_completed', 'Formation terminée', 'Félicitations, tu as terminé cette formation !', jsonb_build_object('formation_id', p_formation));
      perform public.log_event('FORMATION_COMPLETED', p_user, jsonb_build_object('formation_id', p_formation));
      perform public.check_badges(p_user);
    end if;
  end if;
end $$;

-- ---------- RPC étudiant ----------
create or replace function public.complete_lesson(p_lesson uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); l public.lessons%rowtype; v_form uuid; v_enr uuid; v_amt int; v_awarded boolean;
begin
  if v_uid is null then raise exception 'Non authentifié'; end if;
  select * into l from public.lessons where id = p_lesson and status = 'published';
  if not found then raise exception 'Leçon introuvable'; end if;
  select formation_id into v_form from public.formation_modules where id = l.module_id;
  if not public.has_access(v_form) then raise exception 'Accès refusé à cette formation'; end if;
  select id into v_enr from public.enrollments where user_id = v_uid and formation_id = v_form and status in ('active','completed') limit 1;
  insert into public.lesson_progress(user_id, lesson_id, enrollment_id, status, started_at, completed_at, attempts)
  values (v_uid, p_lesson, v_enr, 'completed', now(), now(), 1)
  on conflict (user_id, lesson_id) do update
    set status = case when public.lesson_progress.status = 'mastered' then 'mastered' else 'completed' end,
        completed_at = coalesce(public.lesson_progress.completed_at, now()),
        attempts = public.lesson_progress.attempts + 1;
  perform public.touch_streak(v_uid);
  v_amt := coalesce(l.xp_reward, public.xp_rule('lesson_completed', 20));
  v_awarded := public.award_xp(v_uid, v_amt, 'Leçon terminée : ' || l.title, 'lesson', p_lesson, 'lesson:' || v_uid || ':' || p_lesson, v_form);
  perform public.log_event('LESSON_COMPLETED', v_uid, jsonb_build_object('lesson_id', p_lesson));
  perform public.recompute_progress(v_uid, v_form);
  perform public.check_badges(v_uid);
  return jsonb_build_object('xp_awarded', case when v_awarded then v_amt else 0 end);
end $$;

create or replace function public.get_activity_for_play(p_activity uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.activities%rowtype; v_cfg jsonb; v_shuf_q boolean; v_shuf_a boolean; v_att int; v_res jsonb;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  select * into a from public.activities where id = p_activity and status = 'published';
  if not found then raise exception 'Activité introuvable'; end if;
  if not public.has_access(a.formation_id) then raise exception 'Accès refusé'; end if;
  v_cfg := coalesce(a.configuration, '{}');
  v_shuf_q := coalesce((v_cfg->>'shuffle_questions')::boolean, false);
  v_shuf_a := coalesce((v_cfg->>'shuffle_answers')::boolean, false);
  select count(*) into v_att from public.activity_attempts where user_id = auth.uid() and activity_id = a.id;
  select jsonb_build_object(
    'id', a.id, 'title', a.title, 'description', a.description, 'type', a.type, 'xp_reward', a.xp_reward,
    'passing_score', coalesce((v_cfg->>'passing_score')::int, 70),
    'max_attempts', nullif(v_cfg->>'max_attempts','')::int,
    'attempts_used', v_att,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', qu.id, 'text', qu.question_text, 'type', qu.question_type,
        'points', coalesce(aq.points_override, qu.points), 'media_url', qu.media_url,
        'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'text', o.option_text)
                      order by case when v_shuf_a then random() else o.position::double precision end), '[]'::jsonb)
                    from public.question_options o where o.question_id = qu.id))
        order by case when v_shuf_q then random() else aq.position::double precision end)
      from public.activity_questions aq join public.questions qu on qu.id = aq.question_id
      where aq.activity_id = a.id and qu.status = 'published'), '[]'::jsonb)
  ) into v_res;
  return v_res;
end $$;

create or replace function public.submit_activity(p_activity uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); a public.activities%rowtype; v_cfg jsonb; v_maxatt int; v_att int; v_attempt uuid; v_enr uuid;
  q record; v_sel uuid[]; v_cor uuid[]; v_ok boolean; v_pts numeric; v_score numeric := 0; v_max numeric := 0;
  v_results jsonb := '[]'::jsonb; v_pass int; v_passed boolean; v_pct numeric; v_xp int := 0; v_amt int; v_n int := 0;
begin
  if v_uid is null then raise exception 'Non authentifié'; end if;
  select * into a from public.activities where id = p_activity and status = 'published';
  if not found then raise exception 'Activité introuvable'; end if;
  if not public.has_access(a.formation_id) then raise exception 'Accès refusé'; end if;
  v_cfg := coalesce(a.configuration, '{}');
  v_maxatt := nullif(v_cfg->>'max_attempts','')::int;
  select count(*) into v_att from public.activity_attempts where user_id = v_uid and activity_id = a.id;
  if v_maxatt is not null and v_att >= v_maxatt then raise exception 'Nombre maximal de tentatives atteint'; end if;
  select id into v_enr from public.enrollments where user_id = v_uid and formation_id = a.formation_id and status in ('active','completed') limit 1;
  insert into public.activity_attempts(user_id, activity_id, enrollment_id, attempt_number, answers)
  values (v_uid, a.id, v_enr, v_att + 1, p_answers) returning id into v_attempt;

  for q in select qu.*, coalesce(aq.points_override, qu.points) as pts
             from public.activity_questions aq join public.questions qu on qu.id = aq.question_id
            where aq.activity_id = a.id and qu.status = 'published' order by aq.position loop
    v_n := v_n + 1;
    select coalesce(array_agg(o.id order by o.id), '{}') into v_cor from public.question_options o where o.question_id = q.id and o.is_correct;
    select coalesce(array_agg(distinct x::uuid order by x::uuid), '{}') into v_sel
      from jsonb_array_elements_text(coalesce(p_answers -> q.id::text, '[]'::jsonb)) x;
    v_ok := cardinality(v_cor) > 0 and v_sel = v_cor;
    v_pts := case when v_ok then q.pts else 0 end;
    v_max := v_max + q.pts; v_score := v_score + v_pts;
    insert into public.question_responses(attempt_id, question_id, selected_options, is_correct, points_awarded)
    values (v_attempt, q.id, to_jsonb(v_sel), v_ok, v_pts);
    perform public.update_review_item(v_uid, q.id, v_ok);
    v_results := v_results || jsonb_build_object(
      'question_id', q.id, 'is_correct', v_ok, 'correct_option_ids', to_jsonb(v_cor),
      'selected_option_ids', to_jsonb(v_sel), 'explanation', q.explanation, 'points', v_pts,
      'option_feedback', (select coalesce(jsonb_object_agg(o.id::text, o.feedback) filter (where o.feedback is not null), '{}'::jsonb)
                          from public.question_options o where o.question_id = q.id));
  end loop;
  if v_n = 0 then raise exception 'Cette activité ne contient aucune question'; end if;

  v_pass := coalesce((v_cfg->>'passing_score')::int, 70);
  v_pct := case when v_max > 0 then round(v_score * 100 / v_max, 1) else 0 end;
  v_passed := v_max > 0 and v_pct >= v_pass;
  update public.activity_attempts set score = v_score, max_score = v_max,
         status = case when v_passed then 'passed' else 'failed' end, completed_at = now() where id = v_attempt;

  if v_passed then
    perform public.touch_streak(v_uid);
    v_amt := coalesce(nullif(a.xp_reward,0), public.xp_rule('quiz_passed', 50));
    if public.award_xp(v_uid, v_amt, 'Activité réussie : ' || a.title, 'activity', a.id, 'activity:' || v_uid || ':' || a.id, a.formation_id) then v_xp := v_xp + v_amt; end if;
    if v_score = v_max then
      v_amt := public.xp_rule('perfect_quiz', 25);
      if public.award_xp(v_uid, v_amt, 'Score parfait : ' || a.title, 'activity_perfect', a.id, 'perfect:' || v_uid || ':' || a.id, a.formation_id) then v_xp := v_xp + v_amt; end if;
    end if;
  end if;
  perform public.log_event('ACTIVITY_COMPLETED', v_uid, jsonb_build_object('activity_id', a.id, 'passed', v_passed, 'pct', v_pct));
  perform public.check_badges(v_uid);
  return jsonb_build_object('attempt_id', v_attempt, 'score', v_score, 'max_score', v_max, 'percentage', v_pct,
    'passed', v_passed, 'passing_score', v_pass, 'xp_awarded', v_xp, 'results', v_results,
    'attempts_left', case when v_maxatt is null then null else greatest(v_maxatt - v_att - 1, 0) end);
end $$;

create or replace function public.enroll_in_formation(p_formation uuid, p_mode text default 'classic') returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); f public.formations%rowtype; v_id uuid;
begin
  if v_uid is null then raise exception 'Non authentifié'; end if;
  if p_mode not in ('classic','interactive','intensive') then p_mode := 'classic'; end if;
  select * into f from public.formations where id = p_formation and status = 'published';
  if not found then raise exception 'Formation indisponible'; end if;
  select id into v_id from public.enrollments where user_id = v_uid and formation_id = p_formation and status <> 'cancelled';
  if v_id is not null then return v_id; end if;
  insert into public.enrollments(user_id, formation_id, status, payment_status, learning_mode)
  values (v_uid, f.id, case when f.price = 0 then 'active' else 'pending' end,
          case when f.price = 0 then 'paid' else 'pending' end, p_mode) returning id into v_id;
  perform public.log_event('USER_ENROLLED', v_uid, jsonb_build_object('formation_id', f.id));
  perform public.notify(v_uid, 'enrollment', 'Inscription enregistrée', f.title, jsonb_build_object('formation_id', f.id));
  return v_id;
end $$;

create or replace function public.set_learning_mode(p_enrollment uuid, p_mode text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_mode not in ('classic','interactive','intensive') then raise exception 'Mode invalide'; end if;
  update public.enrollments set learning_mode = p_mode where id = p_enrollment and user_id = auth.uid();
  if not found then raise exception 'Inscription introuvable'; end if;
end $$;

create or replace function public.submit_payment(p_enrollment uuid, p_amount numeric, p_method text,
                                                 p_reference text, p_paid_on date default null, p_proof_url text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); e public.enrollments%rowtype; f public.formations%rowtype; v_id uuid;
begin
  if v_uid is null then raise exception 'Non authentifié'; end if;
  select * into e from public.enrollments where id = p_enrollment and user_id = v_uid and status <> 'cancelled';
  if not found then raise exception 'Inscription introuvable'; end if;
  select * into f from public.formations where id = e.formation_id;
  if p_amount is null or p_amount <= 0 then raise exception 'Montant invalide'; end if;
  if coalesce(trim(p_reference),'') = '' or coalesce(trim(p_method),'') = '' then raise exception 'Référence et moyen de paiement requis'; end if;
  if p_proof_url is not null and left(p_proof_url, length(v_uid::text) + 1) <> v_uid::text || '/' then raise exception 'Preuve invalide'; end if;
  begin
    insert into public.payments(user_id, enrollment_id, amount, currency, payment_method, transaction_reference, paid_on, proof_url)
    values (v_uid, e.id, p_amount, f.currency, trim(p_method), trim(p_reference), p_paid_on, p_proof_url) returning id into v_id;
  exception when unique_violation then raise exception 'Cette référence de transaction a déjà été soumise';
  end;
  perform public.log_event('PAYMENT_SUBMITTED', v_uid, jsonb_build_object('payment_id', v_id));
  insert into public.notifications(user_id, type, title, body, payload)
    select id, 'payment_submitted', 'Nouveau paiement à vérifier', f.title || ' — ' || p_amount || ' ' || f.currency, jsonb_build_object('payment_id', v_id)
    from public.profiles where role in ('admin','superadmin');
  return v_id;
end $$;

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null $$;

create or replace function public.get_leaderboard(p_period text default 'all', p_formation uuid default null, p_limit int default 50)
returns table(rank bigint, user_id uuid, display_name text, total_xp bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  with xp as (
    select t.user_id, sum(t.amount) as s from public.xp_transactions t
    where (p_period = 'all' or (p_period = 'week' and t.created_at >= date_trunc('week', now()))
           or (p_period = 'month' and t.created_at >= date_trunc('month', now())))
      and (p_formation is null or t.formation_id = p_formation)
    group by t.user_id)
  select rank() over (order by xp.s desc)::bigint, xp.user_id,
         coalesce(p.username, 'Étudiant'), xp.s::bigint, (xp.user_id = auth.uid())
  from xp join public.profiles p on p.id = xp.user_id
  left join public.user_settings us on us.user_id = xp.user_id
  where auth.uid() is not null and (coalesce(us.leaderboard_visibility, true) or xp.user_id = auth.uid())
  order by xp.s desc limit least(p_limit, 200) $$;

-- ---------- RPC administration ----------
create or replace function public.review_payment(p_payment uuid, p_approve boolean, p_comment text default null) returns void
language plpgsql security definer set search_path = public as $$
declare p public.payments%rowtype; e public.enrollments%rowtype; f public.formations%rowtype; v_paid numeric;
begin
  if not public.is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  select * into p from public.payments where id = p_payment;
  if not found then raise exception 'Paiement introuvable'; end if;
  if p.status <> 'pending' then raise exception 'Paiement déjà traité'; end if;
  select * into e from public.enrollments where id = p.enrollment_id;
  select * into f from public.formations where id = e.formation_id;
  if p_approve then
    update public.payments set status = 'paid', verified_by = auth.uid(), verified_at = now(), admin_comment = p_comment where id = p.id;
    select coalesce(sum(amount),0) into v_paid from public.payments where enrollment_id = e.id and status = 'paid';
    if v_paid >= f.price then
      update public.enrollments set payment_status = 'paid', status = case when status in ('pending','suspended') then 'active' else status end where id = e.id;
    else
      update public.enrollments set payment_status = 'partially_paid',
             status = case when f.allow_partial_access and status = 'pending' then 'active' else status end where id = e.id;
    end if;
    update public.payment_installments set status = 'paid', paid_at = now()
      where enrollment_id = e.id and status <> 'paid' and
            (select coalesce(sum(i2.amount),0) from public.payment_installments i2 where i2.enrollment_id = e.id and i2.installment_number <= payment_installments.installment_number) <= v_paid;
    perform public.notify(e.user_id, 'payment_verified', 'Paiement validé', f.title, jsonb_build_object('formation_id', f.id));
  else
    update public.payments set status = 'failed', verified_by = auth.uid(), verified_at = now(), admin_comment = p_comment where id = p.id;
    perform public.notify(e.user_id, 'payment_rejected', 'Paiement refusé', coalesce(p_comment, f.title), jsonb_build_object('formation_id', f.id));
  end if;
  perform public.log_event('PAYMENT_VERIFIED', e.user_id, jsonb_build_object('payment_id', p.id, 'approved', p_approve));
end $$;

create or replace function public.admin_grant_access(p_user uuid, p_formation uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  select id into v_id from public.enrollments where user_id = p_user and formation_id = p_formation and status <> 'cancelled';
  if v_id is null then
    insert into public.enrollments(user_id, formation_id, status, payment_status) values (p_user, p_formation, 'active', 'paid') returning id into v_id;
  else
    update public.enrollments set status = 'active' where id = v_id and status in ('pending','suspended');
  end if;
  perform public.notify(p_user, 'access_granted', 'Accès à la formation débloqué', null, jsonb_build_object('formation_id', p_formation));
  return v_id;
end $$;

create or replace function public.admin_set_suspended(p_user uuid, p_value boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  perform set_config('app.bypass_profile_guard', '1', true);
  update public.profiles set is_suspended = p_value where id = p_user and role <> 'superadmin';
end $$;

create or replace function public.admin_set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'Réservé au superadministrateur'; end if;
  if p_role not in ('student','instructor','admin','superadmin') then raise exception 'Rôle invalide'; end if;
  perform set_config('app.bypass_profile_guard', '1', true);
  update public.profiles set role = p_role where id = p_user;
end $$;

create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_staff() then raise exception 'Réservé au personnel'; end if;
  select jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'enrollments', (select count(*) from public.enrollments where status <> 'cancelled'),
    'active_enrollments', (select count(*) from public.enrollments where status = 'active'),
    'formations', (select count(*) from public.formations where status = 'published'),
    'revenue', (select coalesce(sum(amount),0) from public.payments where status = 'paid'),
    'pending_payments', (select count(*) from public.payments where status = 'pending'),
    'avg_progress', (select coalesce(round(avg(progress_percentage),1),0) from public.module_progress),
    'completion_rate', (select case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where status = 'completed') / count(*), 1) end from public.enrollments where status in ('active','completed')),
    'active_students_7d', (select count(distinct user_id) from public.xp_transactions where created_at > now() - interval '7 days')
  ) into r;
  return r;
end $$;

create or replace function public.question_stats(p_limit int default 20)
returns table(question_id uuid, question_text text, attempts bigint, success_rate numeric)
language sql stable security definer set search_path = public as $$
  select q.id, q.question_text, count(r.id)::bigint,
         round(100.0 * count(r.id) filter (where r.is_correct) / nullif(count(r.id),0), 1)
  from public.questions q join public.question_responses r on r.question_id = q.id
  where public.is_staff()
  group by q.id, q.question_text having count(r.id) > 0
  order by 4 asc nulls last, 3 desc limit p_limit $$;

-- ---------- Vue publique : plan d'un cours (sans contenu) ----------
create or replace view public.lesson_outline as
  select l.id, l.module_id, m.formation_id, l.title, l.slug, l.position, l.estimated_duration, l.xp_reward
  from public.lessons l
  join public.formation_modules m on m.id = l.module_id
  join public.formations f on f.id = m.formation_id
  where l.status = 'published' and f.status = 'published';

-- ---------- Droits d'exécution ----------
revoke all on function public.award_xp(uuid,int,text,text,uuid,text,uuid) from public, anon, authenticated;
revoke all on function public.check_badges(uuid) from public, anon, authenticated;
revoke all on function public.touch_streak(uuid) from public, anon, authenticated;
revoke all on function public.update_review_item(uuid,uuid,boolean) from public, anon, authenticated;
revoke all on function public.recompute_progress(uuid,uuid) from public, anon, authenticated;
revoke all on function public.log_event(text,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.notify(uuid,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.xp_rule(text,int) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.complete_lesson(uuid) from public, anon;
revoke all on function public.get_activity_for_play(uuid) from public, anon;
revoke all on function public.submit_activity(uuid,jsonb) from public, anon;
revoke all on function public.enroll_in_formation(uuid,text) from public, anon;
revoke all on function public.set_learning_mode(uuid,text) from public, anon;
revoke all on function public.submit_payment(uuid,numeric,text,text,date,text) from public, anon;
revoke all on function public.mark_notifications_read() from public, anon;
revoke all on function public.get_leaderboard(text,uuid,int) from public, anon;
revoke all on function public.review_payment(uuid,boolean,text) from public, anon;
revoke all on function public.admin_grant_access(uuid,uuid) from public, anon;
revoke all on function public.admin_set_suspended(uuid,boolean) from public, anon;
revoke all on function public.admin_set_role(uuid,text) from public, anon;
revoke all on function public.admin_stats() from public, anon;
revoke all on function public.question_stats(int) from public, anon;
grant execute on function public.complete_lesson(uuid), public.get_activity_for_play(uuid), public.submit_activity(uuid,jsonb),
  public.enroll_in_formation(uuid,text), public.set_learning_mode(uuid,text), public.submit_payment(uuid,numeric,text,text,date,text),
  public.mark_notifications_read(), public.get_leaderboard(text,uuid,int), public.review_payment(uuid,boolean,text),
  public.admin_grant_access(uuid,uuid), public.admin_set_suspended(uuid,boolean), public.admin_set_role(uuid,text),
  public.admin_stats(), public.question_stats(int) to authenticated;
grant execute on function public.is_staff(), public.is_admin(), public.is_superadmin(), public.has_access(uuid), public.current_role_name() to anon, authenticated;
grant select on public.lesson_outline to anon, authenticated;
