set role authenticated; set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
create temp table r as select public.get_activity_for_play((select id from activities where title='Quiz : la marge')) j;
create temp table ans as select jsonb_build_object(q->>'id', jsonb_build_array(o->>'id')) a from r, jsonb_array_elements(j->'questions') q, jsonb_array_elements(q->'options') o where o->>'text'='1 400 FCFA';
select public.submit_activity((select id from activities where title='Quiz : la marge'),(select a from ans))->>'xp_awarded' as xp1;
select public.submit_activity((select id from activities where title='Quiz : la marge'),(select a from ans))->>'xp_awarded' as xp2_repeat;
select total_xp from user_stats; select count(*) badges from user_badges; select count(*) reviews from review_items;
