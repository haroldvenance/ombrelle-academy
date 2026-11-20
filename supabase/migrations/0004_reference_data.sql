-- Données de référence (configurables par l'administrateur)
insert into public.levels (level_number, name, required_xp) values
 (1,'Débutant',0),(2,'Explorateur',500),(3,'Apprenti',1500),(4,'Stratège',3000),(5,'Expert',5000),(6,'Maître',8000),(7,'Champion',12000)
on conflict (level_number) do nothing;

insert into public.xp_rules (action, amount, description) values
 ('lesson_completed',20,'Terminer une leçon'),('quiz_passed',50,'Réussir un quiz'),('perfect_quiz',25,'Bonus quiz parfait'),
 ('exercise_completed',75,'Terminer un exercice'),('challenge_won',100,'Réussir un défi'),
 ('module_completed',150,'Terminer un module'),('quest_completed',300,'Terminer une quête'),
 ('review_passed',30,'Révision réussie'),('formation_completed',500,'Terminer une formation')
on conflict (action) do nothing;

insert into public.app_settings (key, value) values
 ('review_intervals', '{"0":1,"1":2,"2":5,"3":14,"4":30}')
on conflict (key) do nothing;

insert into public.badges (name, slug, description, condition_type, condition_config, rarity) values
 ('Premier pas','premier-pas','Première leçon terminée','lessons_completed','{"count":1}','common'),
 ('Curieux','curieux','10 leçons terminées','lessons_completed','{"count":10}','common'),
 ('Analyste','analyste','5 quiz réussis','quizzes_passed','{"count":5}','rare'),
 ('Perfectionniste','perfectionniste','Un quiz réussi à 100 %','perfect_quiz','{}','rare'),
 ('Discipliné','discipline','Série de 7 jours','streak_days','{"count":7}','epic'),
 ('Challenger','challenger','5 défis réussis','challenges_completed','{"count":5}','epic'),
 ('Expert','expert','Formation terminée','formation_completed','{"count":1}','legendary')
on conflict (slug) do nothing;
