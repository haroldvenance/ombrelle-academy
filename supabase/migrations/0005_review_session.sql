-- =====================================================================
-- 0005_review_session.sql : sessions de révision espacée
-- Corrections intégrées :
--   - FOR UPDATE dans submit_review_answer (évite double update_review_item)
--   - Idempotence : question déjà révisée → retour propre (skipped), pas d'exception
-- =====================================================================

create or replace function public.get_review_session(p_limit int default 10)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_total int;
  v_questions jsonb;
begin
  if v_uid is null then raise exception 'Non authentifié'; end if;

  select count(*) into v_total
  from public.review_items ri
  join public.questions q on q.id = ri.question_id
  where ri.user_id = v_uid
    and ri.status = 'active'
    and ri.next_review_at <= now()
    and q.status = 'published';

  select coalesce(jsonb_agg(qd order by due_date asc), '[]'::jsonb) into v_questions
  from (
    select
      ri.next_review_at as due_date,
      jsonb_build_object(
        'id', q.id,
        'text', q.question_text,
        'type', q.question_type,
        'mastery_score', ri.mastery_score,
        'next_review_at', ri.next_review_at,
        'options', (
          select coalesce(
            jsonb_agg(jsonb_build_object('id', o.id, 'text', o.option_text) order by random()),
            '[]'::jsonb
          )
          from public.question_options o where o.question_id = q.id
        )
      ) as qd
    from public.review_items ri
    join public.questions q on q.id = ri.question_id
    where ri.user_id = v_uid
      and ri.status = 'active'
      and ri.next_review_at <= now()
      and q.status = 'published'
    order by ri.next_review_at asc
    limit least(greatest(p_limit, 1), 50)
  ) sub;

  return jsonb_build_object('total_due', v_total, 'questions', v_questions);
end $$;

create or replace function public.submit_review_answer(p_question uuid, p_selected jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ri public.review_items%rowtype;
  v_cor uuid[];
  v_sel uuid[];
  v_ok boolean;
  v_expl text;
  v_key text;
  v_amt int;
  v_xp int := 0;
  v_new public.review_items%rowtype;
begin
  if v_uid is null then raise exception 'Non authentifié'; end if;

  -- Lock la ligne pour éviter deux updates concurrents de update_review_item.
  select * into v_ri
  from public.review_items
  where user_id = v_uid and question_id = p_question
    and status = 'active' and next_review_at <= now()
  for update;

  if not found then
    -- Déjà révisée entre-temps (double onglet, clic en rafale) :
    -- on renvoie un état propre plutôt qu'une exception.
    select * into v_new from public.review_items
    where user_id = v_uid and question_id = p_question;
    if found then
      return jsonb_build_object(
        'skipped', true,
        'next_review_at', v_new.next_review_at,
        'mastery_score', v_new.mastery_score,
        'is_correct', null,
        'xp_awarded', 0
      );
    end if;
    raise exception 'Cette question n''est pas due pour révision';
  end if;

  select coalesce(array_agg(o.id order by o.id), '{}') into v_cor
  from public.question_options o
  where o.question_id = p_question and o.is_correct;

  select coalesce(array_agg(distinct x::uuid order by x::uuid), '{}') into v_sel
  from jsonb_array_elements_text(coalesce(p_selected, '[]'::jsonb)) x;

  v_ok := cardinality(v_cor) > 0 and v_sel = v_cor;

  select explanation into v_expl from public.questions where id = p_question;

  v_key := 'review:' || v_uid || ':' || p_question || ':'
           || extract(epoch from v_ri.next_review_at)::bigint;

  perform public.update_review_item(v_uid, p_question, v_ok);

  if v_ok then
    v_amt := public.xp_rule('review_passed', 30);
    if public.award_xp(v_uid, v_amt, 'Révision réussie', 'review', p_question, v_key, null) then
      v_xp := v_amt;
    end if;
    perform public.touch_streak(v_uid);
  end if;

  select * into v_new from public.review_items
  where user_id = v_uid and question_id = p_question;

  perform public.log_event('REVIEW_ANSWERED', v_uid,
    jsonb_build_object('question_id', p_question, 'correct', v_ok));

  return jsonb_build_object(
    'skipped', false,
    'is_correct', v_ok,
    'correct_option_ids', to_jsonb(v_cor),
    'selected_option_ids', to_jsonb(v_sel),
    'explanation', v_expl,
    'next_review_at', v_new.next_review_at,
    'mastery_score', v_new.mastery_score,
    'xp_awarded', v_xp
  );
end $$;

create or replace function public.get_review_due_count()
returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int
  from public.review_items ri
  join public.questions q on q.id = ri.question_id
  where ri.user_id = auth.uid()
    and ri.status = 'active'
    and ri.next_review_at <= now()
    and q.status = 'published'
$$;

revoke all on function public.get_review_session(int)   from public, anon;
revoke all on function public.submit_review_answer(uuid, jsonb) from public, anon;
revoke all on function public.get_review_due_count()    from public, anon;

grant execute on function public.get_review_session(int)         to authenticated;
grant execute on function public.submit_review_answer(uuid, jsonb) to authenticated;
grant execute on function public.get_review_due_count()          to authenticated;