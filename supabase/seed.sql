-- Contenu de démonstration (3 formations de lancement). Exécuté par `supabase db reset`.
create or replace function pg_temp.mk_quiz(p_form uuid, p_mod uuid, p_lesson uuid, p_title text, p_items jsonb, p_xp int default 50)
returns uuid language plpgsql as $$
declare v_act uuid; it jsonb; v_q uuid; o jsonb; i int := 0; j int;
begin
  insert into public.activities(formation_id, module_id, lesson_id, title, type, configuration, xp_reward, status, position)
  values (p_form, p_mod, p_lesson, p_title, 'quiz', '{"passing_score":60,"shuffle_answers":true}', p_xp, 'published', 10) returning id into v_act;
  for it in select * from jsonb_array_elements(p_items) loop
    i := i + 1;
    insert into public.questions(formation_id, module_id, question_text, question_type, difficulty, explanation, points, tags)
    values (p_form, p_mod, it->>'q', coalesce(it->>'type','single_choice'), 'easy', it->>'expl', 10, '{}') returning id into v_q;
    j := 0;
    for o in select * from jsonb_array_elements(it->'opts') loop
      j := j + 1;
      insert into public.question_options(question_id, option_text, is_correct, feedback, position)
      values (v_q, o->>0, (o->>1)::boolean, o->>2, j);
    end loop;
    insert into public.activity_questions(activity_id, question_id, position) values (v_act, v_q, i);
  end loop;
  return v_act;
end $$;

do $$
declare f1 uuid; f2 uuid; f3 uuid; m uuid; l uuid;
begin
  -- ===================== BRVM =====================
  insert into public.formations(title, slug, description, objectives, category, difficulty, duration_days, price, status, published_at)
  values ('Bourse BRVM', 'bourse-brvm',
    'Comprendre la Bourse Régionale des Valeurs Mobilières, les actions, les obligations, le rendement et le risque, et apprendre à construire un portefeuille.',
    '["Comprendre le fonctionnement de la BRVM","Distinguer actions et obligations","Comprendre rendement et risque","Découvrir le processus d''achat et de vente de titres"]',
    'Finance', 'beginner', 21, 35000, 'published', now()) returning id into f1;

  insert into public.formation_modules(formation_id, title, description, position) values (f1, 'Introduction à la Bourse', 'Les bases des marchés financiers', 1) returning id into m;
  insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
   (m, 'Qu''est-ce que la Bourse ?', 'quest-ce-que-la-bourse', 'Rôle et fonctionnement d''une bourse de valeurs', $j$[
     {"type":"heading","text":"Une place de rencontre"},
     {"type":"text","text":"La Bourse est un marché organisé où des entreprises et des États peuvent lever de l'argent, et où des investisseurs peuvent acheter et vendre des titres financiers.\nElle permet de financer l'économie tout en offrant aux épargnants une façon de faire fructifier leur argent."},
     {"type":"definition","text":"Une action représente une fraction du capital d'une entreprise."},
     {"type":"example","text":"Une entreprise possède 1 000 actions. Tu achètes 10 actions.\nTu détiens 1 % de son capital."},
     {"type":"warning","text":"Investir comporte des risques. Le capital investi peut être perdu."},
     {"type":"summary","text":"La Bourse met en relation ceux qui ont besoin de financement et ceux qui cherchent à investir."}]$j$, 1, 10, 'published', now()) returning id into l;
  perform pg_temp.mk_quiz(f1, m, l, 'Quiz : les bases de la Bourse', $j$[
    {"q":"Qu'est-ce qu'une action ?","expl":"Une action représente une part du capital d'une entreprise.","opts":[["Un prêt",false,"Un prêt correspond plutôt à une obligation."],["Une part du capital",true,null],["Un compte bancaire",false,null],["Un actif numérique",false,null]]},
    {"q":"Un investissement en Bourse peut entraîner une perte en capital.","type":"true_false","expl":"Aucun investissement en actions n'est garanti : le capital peut baisser.","opts":[["Vrai",true,null],["Faux",false,null]]},
    {"q":"Quel est le rôle principal de la Bourse ?","expl":"Elle met en relation entreprises/États en recherche de financement et investisseurs.","opts":[["Imprimer la monnaie",false,null],["Mettre en relation émetteurs et investisseurs",true,null],["Fixer les salaires",false,null]]}
  ]$j$);
  insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
   (m, 'Actions et obligations', 'actions-et-obligations', 'Deux grandes familles de titres', $j$[
     {"type":"heading","text":"Deux façons d'investir"},
     {"type":"table","headers":["","Action","Obligation"],"rows":[["Nature","Part du capital","Prêt à l'émetteur"],["Revenu","Dividende","Intérêts (coupon)"],["Risque","Plus élevé","Généralement plus faible"]]},
     {"type":"definition","text":"Une obligation est un titre de créance : l'investisseur prête de l'argent à un émetteur qui s'engage à le rembourser avec des intérêts."},
     {"type":"question","text":"Selon toi, pourquoi une obligation est-elle généralement moins risquée qu'une action ?"},
     {"type":"summary","text":"Action = propriétaire d'une partie de l'entreprise. Obligation = prêteur."}]$j$, 2, 12, 'published', now());
  insert into public.formation_modules(formation_id, title, description, position) values (f1, 'La BRVM en pratique', 'Fonctionnement et acteurs', 2) returning id into m;
  insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
   (m, 'Acheter et vendre des titres', 'acheter-et-vendre', 'Le rôle des SGI et le parcours d''un ordre', $j$[
     {"type":"heading","text":"Passer par une SGI"},
     {"type":"text","text":"Pour investir à la BRVM, on ouvre un compte titres auprès d'une Société de Gestion et d'Intermédiation (SGI), qui transmet les ordres d'achat et de vente sur le marché."},
     {"type":"list","items":["Ouvrir un compte titres","Alimenter le compte","Passer un ordre d'achat","Suivre son portefeuille"]},
     {"type":"warning","text":"Vérifie toujours que l'intermédiaire est agréé avant de lui confier de l'argent."}]$j$, 1, 8, 'published', now()) returning id into l;
  perform pg_temp.mk_quiz(f1, m, l, 'Quiz : acheter et vendre', $j$[
    {"q":"Par quel intermédiaire passe-t-on pour acheter des titres cotés ?","expl":"Les ordres passent par une SGI agréée.","opts":[["Une SGI agréée",true,null],["Un réseau social",false,null],["Un vendeur anonyme",false,null]]}
  ]$j$);

  -- ===================== Investissement & Crypto =====================
  insert into public.formations(title, slug, description, objectives, category, difficulty, duration_days, price, status, published_at)
  values ('Investissement & Crypto', 'investissement-crypto',
    'Découvrir les classes d''actifs, les crypto-actifs, les portefeuilles numériques, la diversification et savoir repérer les fraudes.',
    '["Comprendre les classes d''actifs","Découvrir les crypto-actifs et portefeuilles","Comprendre la diversification","Identifier les risques de fraude"]',
    'Finance', 'beginner', 14, 25000, 'published', now()) returning id into f2;
  insert into public.formation_modules(formation_id, title, position) values (f2, 'Les classes d''actifs', 1) returning id into m;
  insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
   (m, 'Diversifier pour réduire le risque', 'diversification', 'Ne pas mettre tous ses œufs dans le même panier', $j$[
     {"type":"heading","text":"La diversification"},
     {"type":"text","text":"Répartir son capital entre plusieurs actifs (actions, obligations, immobilier, liquidités...) permet de limiter l'impact d'une mauvaise performance isolée."},
     {"type":"example","text":"Si tu investis 100 000 FCFA dans un seul actif qui perd 50 %, tu perds 50 000 FCFA. Réparti sur 5 actifs, la même perte n'en touche qu'un cinquième."},
     {"type":"warning","text":"Les crypto-actifs sont très volatils. N'investis jamais plus que ce que tu peux te permettre de perdre."}]$j$, 1, 8, 'published', now()) returning id into l;
  perform pg_temp.mk_quiz(f2, m, l, 'Quiz : diversification et risques', $j$[
    {"q":"Quel est l'objectif principal de la diversification ?","expl":"Elle réduit l'impact d'un actif qui perd de la valeur.","opts":[["Garantir un gain",false,null],["Réduire le risque",true,null],["Éviter tout impôt",false,null]]},
    {"q":"Une promesse de rendement garanti de 30 % par mois est un signe de fraude potentielle.","type":"true_false","expl":"Aucun rendement élevé ne peut être garanti : méfie-toi des promesses irréalistes.","opts":[["Vrai",true,null],["Faux",false,null]]}
  ]$j$);

  -- ===================== E-commerce & Mobile Money =====================
  insert into public.formations(title, slug, description, objectives, category, difficulty, duration_days, price, status, published_at)
  values ('E-commerce & Mobile Money', 'ecommerce-mobile-money',
    'Créer et développer une boutique en ligne, gérer les commandes et encaisser avec le Mobile Money en toute sécurité.',
    '["Comprendre les bases du e-commerce","Présenter ses produits","Gérer commandes et clients","Utiliser le Mobile Money en sécurité"]',
    'Digital', 'beginner', 14, 0, 'published', now()) returning id into f3;
  insert into public.formation_modules(formation_id, title, position) values (f3, 'Lancer sa boutique', 1) returning id into m;
  insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
   (m, 'Calculer sa marge', 'calculer-sa-marge', 'Prix de vente, coûts et marge', $j$[
     {"type":"heading","text":"Prix, coûts, marge"},
     {"type":"definition","text":"La marge est la différence entre le prix de vente et le coût total d'un produit (achat, livraison, frais de paiement)."},
     {"type":"example","text":"Achat : 4 000 FCFA. Livraison : 500 FCFA. Frais Mobile Money : 100 FCFA.\nCoût total : 4 600 FCFA. Prix de vente : 6 000 FCFA.\nMarge : 1 400 FCFA."}]$j$, 1, 7, 'published', now()) returning id into l;
  perform pg_temp.mk_quiz(f3, m, l, 'Quiz : la marge', $j$[
    {"q":"Un produit coûte 4 600 FCFA (tout compris) et se vend 6 000 FCFA. Quelle est la marge ?","expl":"6 000 − 4 600 = 1 400 FCFA.","opts":[["1 000 FCFA",false,null],["1 400 FCFA",true,null],["4 600 FCFA",false,null]]}
  ]$j$);
end $$;
