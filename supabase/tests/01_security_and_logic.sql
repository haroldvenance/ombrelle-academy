\set ON_ERROR_STOP off
insert into auth.users(id,email) values ('11111111-1111-1111-1111-111111111111','a@x.com'),('22222222-2222-2222-2222-222222222222','admin@x.com');
update public.profiles set role='admin' where id='22222222-2222-2222-2222-222222222222';
set role authenticated; set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
\echo -- student enroll free formation
select public.enroll_in_formation((select id from formations where slug='ecommerce-mobile-money'),'classic') is not null as enrolled;
\echo -- lesson content visible after enroll
select count(*) from lessons;
\echo -- student cannot read correct answers
select count(*) as options_visible from question_options;
\echo -- complete lesson
select public.complete_lesson((select id from lesson_outline where slug='calculer-sa-marge'));
\echo -- again (idempotent)
select public.complete_lesson((select id from lesson_outline where slug='calculer-sa-marge'));
\echo -- play + submit
select jsonb_array_length(public.get_activity_for_play((select id from activities where title='Quiz : la marge'))->'questions') as nq;
select public.get_activity_for_play((select id from activities where title='Quiz : la marge'))::text like '%is_correct%' as leaks;
do $$ declare a uuid:=(select id from public.activities where title='Quiz : la marge'); q uuid; o uuid; r jsonb; begin
 select question_id into q from public.activity_questions where false; end $$;
\echo -- stats
select total_xp, level_number from user_stats;
\echo -- forbidden writes
update user_stats set total_xp=99999;
insert into xp_transactions(user_id,amount,reason,idempotency_key) values ('11111111-1111-1111-1111-111111111111',5000,'x','k');
update profiles set role='superadmin' where id='11111111-1111-1111-1111-111111111111';
select role from profiles where id='11111111-1111-1111-1111-111111111111';
update enrollments set status='active';
\echo -- paid formation: no access
select public.enroll_in_formation((select id from formations where slug='bourse-brvm'));
select count(*) as brvm_lessons_visible from lessons l join formation_modules m on m.id=l.module_id join formations f on f.id=m.formation_id where f.slug='bourse-brvm';
select public.get_activity_for_play((select id from activities where title='Quiz : les bases de la Bourse'));
select public.review_payment(gen_random_uuid(), true);
select public.admin_stats();
\echo -- leaderboard
select * from public.get_leaderboard();
