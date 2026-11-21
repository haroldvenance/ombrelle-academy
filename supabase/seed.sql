-- ==============================================================================
-- SCRIPT DE DONNÉES DE DÉMONSTRATION POUR OMBRELLE ACADEMY
-- À exécuter dans l'éditeur SQL de Supabase (en production).
-- Ce script est idempotent : il ne dupliquera pas les données s'il est relancé.
-- ==============================================================================

-- 1. Création d'une fonction utilitaire pour insérer les quiz proprement
create or replace function pg_temp.mk_quiz(p_form uuid, p_mod uuid, p_lesson uuid, p_title text, p_items jsonb, p_xp int default 50)
returns uuid language plpgsql as $$
declare 
  v_act uuid; 
  it jsonb; 
  v_q uuid; 
  o jsonb; 
  i int := 0; 
  j int;
begin
  -- On vérifie si l'activité existe déjà pour éviter les doublons
  select id into v_act from public.activities where title = p_title and lesson_id = p_lesson limit 1;
  
  if v_act is null then
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
  end if;
  
  return v_act;
end $$;

-- 2. Insertion du contenu
do $$
declare 
  f1 uuid; f2 uuid; f3 uuid; 
  m uuid; l uuid;
begin
  -- =========================================================================
  -- FORMATION 1 : BOURSE BRVM
  -- =========================================================================
  if not exists (select 1 from public.formations where slug = 'bourse-brvm') then
    insert into public.formations(title, slug, description, objectives, category, difficulty, duration_days, price, status, published_at)
    values ('Bourse BRVM', 'bourse-brvm',
      'Comprendre la Bourse Régionale des Valeurs Mobilières (BRVM), les actions, les obligations, et apprendre à investir étape par étape.',
      '["Comprendre le fonctionnement de la BRVM","Distinguer actions et obligations","Comprendre rendement et risque","Savoir comment acheter ses premières actions"]',
      'Finance', 'beginner', 21, 35000, 'published', now()) returning id into f1;

    -- Module 1
    insert into public.formation_modules(formation_id, title, description, position) values (f1, 'Les bases de la Bourse', 'Comprendre ce qu''est la Bourse et comment elle fonctionne.', 1) returning id into m;
    
    insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
     (m, 'C''est quoi la Bourse ?', 'cest-quoi-la-bourse', 'Découvrez le rôle de la Bourse dans l''économie.', $j$[
       {"type":"heading","text":"La Bourse : un grand marché"},
       {"type":"text","text":"Imaginez un grand marché où l'on n'achète pas des tomates ou du tissu, mais des 'parts d'entreprises'. C'est ça, la Bourse.\nQuand une entreprise a besoin d'argent pour grandir (construire une usine, embaucher), elle peut vendre des morceaux d'elle-même au public. Ces morceaux s'appellent des **actions**."},
       {"type":"definition","text":"La BRVM (Bourse Régionale des Valeurs Mobilières) est la Bourse commune aux 8 pays de l'UEMOA (Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo). Elle est basée à Abidjan."},
       {"type":"example","text":"La société SONATEL (Sénégal) est cotée à la BRVM. Si vous achetez une action SONATEL, vous devenez copropriétaire d'une infime partie de cette entreprise."},
       {"type":"warning","text":"Investir en Bourse n'est pas un jeu. Il y a un risque de perdre de l'argent si l'entreprise fait faillite ou si le cours de l'action baisse."},
       {"type":"summary","text":"La Bourse permet aux entreprises de trouver de l'argent et aux investisseurs de faire fructifier leur épargne en devenant copropriétaires."}]$j$, 1, 10, 'published', now()) returning id into l;
    
    perform pg_temp.mk_quiz(f1, m, l, 'Quiz : Les bases de la Bourse', $j$[
      {"q":"Qu'est-ce qu'une action en Bourse ?","expl":"Une action est un titre de propriété. En acheter, c'est devenir actionnaire (copropriétaire) de l'entreprise.","opts":[["Un prêt accordé à une entreprise",false,"Non, un prêt est une obligation."],["Une part du capital d'une entreprise",true,null],["Un compte d'épargne classique",false,null]]},
      {"q":"La BRVM est la bourse de quel pays ?","expl":"La BRVM est une bourse régionale qui couvre 8 pays d'Afrique de l'Ouest. Elle est basée en Côte d'Ivoire.","opts":[["Uniquement de la Côte d'Ivoire",false,"Elle est régionale, pas uniquement ivoirienne."],["De 8 pays d'Afrique de l'Ouest (UEMOA)",true,null],["De toute l'Afrique",false,null]]}
    ]$j$);

    -- Module 2
    insert into public.formation_modules(formation_id, title, description, position) values (f1, 'Comment investir concrètement ?', 'Le guide pratique pour passer à l''action.', 2) returning id into m;
    
    insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
     (m, 'Ouvrir un compte et acheter', 'acheter-des-actions', 'Les étapes pour passer votre premier ordre.', $j$[
       {"type":"heading","text":"Passer à l'action"},
       {"type":"text","text":"Vous ne pouvez pas acheter des actions directement à la BRVM. Vous devez passer par un intermédiaire agréé appelé **SGI** (Société de Gestion et d'Intermédiation)."},
       {"type":"list","items":[
         "1. Choisir une SGI (ex: BOA Capital, NSIA Finance, etc.) et ouvrir un compte-titres.",
         "2. Fournir vos pièces d'identité et justificatifs de domicile.",
         "3. Alimenter votre compte avec de l'argent (par virement ou Mobile Money).",
         "4. Passer un ordre d'achat (dire à la SGI : 'Je veux 10 actions SONATEL')."
       ]},
       {"type":"warning","text":"Ne confiez jamais votre argent à un inconnu sur les réseaux sociaux qui vous promet des actions. Passez toujours par une SGI officielle."}]$j$, 1, 8, 'published', now()) returning id into l;
    
    perform pg_temp.mk_quiz(f1, m, l, 'Quiz : Acheter des actions', $j$[
      {"q":"Par quel intermédiaire doit-on obligatoirement passer pour acheter des actions à la BRVM ?","expl":"Les SGI sont les seuls organismes agréés pour transmettre vos ordres à la BRVM.","opts":[["Un ami qui travaille à la banque",false,null],["Une SGI (Société de Gestion et d'Intermédiation)",true,null],["Directement sur le site de la BRVM",false,"La BRVM ne reçoit pas les particuliers directement."]]}
    ]$j$);
  end if;

  -- =========================================================================
  -- FORMATION 2 : INVESTISSEMENT & CRYPTO
  -- =========================================================================
  if not exists (select 1 from public.formations where slug = 'investissement-crypto') then
    insert into public.formations(title, slug, description, objectives, category, difficulty, duration_days, price, status, published_at)
    values ('Investissement & Crypto', 'investissement-crypto',
      'Découvrir comment faire travailler son argent, comprendre la diversification et démystifier les crypto-monnaies en évitant les pièges.',
      '["Comprendre pourquoi il faut investir","Découvrir les classes d''actifs","Comprendre la diversification","Identifier les risques et arnaques crypto"]',
      'Finance', 'beginner', 14, 25000, 'published', now()) returning id into f2;
    
    insert into public.formation_modules(formation_id, title, description, position) values (f2, 'Les principes de base', 'Comment ne pas perdre son argent et le faire fructifier.', 1) returning id into m;
    
    insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
     (m, 'La diversification (le secret des pros)', 'diversification', 'Pourquoi il ne faut pas mettre tous ses œufs dans le même panier.', $j$[
       {"type":"heading","text":"Le risque zéro n'existe pas"},
       {"type":"text","text":"L'inflation (la hausse des prix) fait perdre de la valeur à votre argent qui dort sur un compte bancaire. Pour le protéger, il faut l'investir. Mais où ? C'est là qu'intervient la diversification."},
       {"type":"definition","text":"La diversification consiste à répartir son argent sur plusieurs types d'investissements différents (actions, immobilier, épargne) pour réduire le risque global."},
       {"type":"example","text":"Si vous mettez 100 000 FCFA dans une seule entreprise et qu'elle fait faillite, vous perdez tout. Si vous mettez 20 000 FCFA dans 5 entreprises et qu'une seule fait faillite, vous ne perdez que 20% de votre capital."}]$j$, 1, 8, 'published', now()) returning id into l;
    
    perform pg_temp.mk_quiz(f2, m, l, 'Quiz : La diversification', $j$[
      {"q":"Pourquoi est-il déconseillé de mettre tout son argent dans une seule action ?","expl":"Si cette unique entreprise fait faillite, vous perdez 100% de votre investissement. La diversification protège contre ce scénario.","opts":[["Parce que c'est illégal",false,null],["Parce que le risque de tout perdre est trop élevé",true,null],["Parce que ça rapporte moins d'argent",false,null]]}
    ]$j$);

    insert into public.formation_modules(formation_id, title, description, position) values (f2, 'Le monde des Crypto-actifs', 'Bitcoin, blockchain et sécurité.', 2) returning id into m;
    
    insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
     (m, 'Les pièges à éviter', 'pieges-crypto', 'Comment reconnaître une arnaque aux crypto-monnaies.', $j$[
       {"type":"heading","text":"Méfiez-vous des promesses"},
       {"type":"text","text":"Les crypto-monnaies (comme le Bitcoin) sont très populaires, mais aussi très risquées. Leur prix monte et descend très vite (volatilité). C'est un terrain de jeu pour les escrocs."},
       {"type":"list","items":[
         "❌ On vous promet de doubler votre argent en 24h ? C'est une arnaque.",
         "❌ On vous demande de payer pour 'débloquer' vos gains ? C'est une arnaque.",
         "❌ On vous met la pression pour investir vite ('offre limitée') ? C'est une technique de manipulation."
       ]},
       {"type":"warning","text":"Règle d'or : N'investissez jamais de l'argent dont vous avez besoin pour vivre (loyer, nourriture, santé) dans les cryptos."}]$j$, 1, 8, 'published', now()) returning id into l;
    
    perform pg_temp.mk_quiz(f2, m, l, 'Quiz : Arnaques et Crypto', $j$[
      {"q":"Un site web vous promet de tripler votre argent en 48h grâce à l'Intelligence Artificielle. Que faites-vous ?","expl":"C'est la définition même d'un schéma de Ponzi. Aucun investissement légitime ne garantit un rendement aussi élevé en si peu de temps.","opts":[["J'investis un petit montant pour tester",false,null],["Je fuis, c'est une arnaque évidente",true,null],["J'en parle à mes amis pour qu'ils investissent aussi",false,null]]}
    ]$j$);
  end if;

  -- =========================================================================
  -- FORMATION 3 : E-COMMERCE & MOBILE MONEY (GRATUITE)
  -- =========================================================================
  if not exists (select 1 from public.formations where slug = 'ecommerce-mobile-money') then
    insert into public.formations(title, slug, description, objectives, category, difficulty, duration_days, price, status, published_at)
    values ('E-commerce & Mobile Money', 'ecommerce-mobile-money',
      'Apprenez à vendre en ligne et à encaisser vos clients facilement et en toute sécurité grâce au Mobile Money.',
      '["Trouver une idée de produit","Calculer sa marge bénéficiaire","Créer une boutique simple","Encaisser avec Wave, Orange Money ou MTN"]',
      'Digital', 'beginner', 14, 0, 'published', now()) returning id into f3;
    
    insert into public.formation_modules(formation_id, title, description, position) values (f3, 'Les bases du Commerce', 'Savoir vendre au bon prix.', 1) returning id into m;
    
    insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
     (m, 'Calculer sa marge (le nerf de la guerre)', 'calculer-sa-marge', 'Apprenez à fixer un prix qui vous fait gagner de l''argent.', $j$[
       {"type":"heading","text":"Ne travaillez pas à perte"},
       {"type":"text","text":"Beaucoup de débutants vendent à un prix qui ne couvre pas tous leurs frais. Pour savoir si vous gagnez de l'argent, vous devez calculer votre marge."},
       {"type":"definition","text":"La marge = Prix de Vente - (Coût d'achat du produit + Frais de transport + Frais de communication/paiement)."},
       {"type":"example","text":"J'achète un sac à 4 000 FCFA.\nJe paie 500 FCFA de transport.\nLe client paie des frais de transfert de 100 FCFA.\nMon coût total : 4 600 FCFA.\nSi je vends le sac à 6 000 FCFA, ma marge est de 1 400 FCFA (6 000 - 4 600)."}]$j$, 1, 7, 'published', now()) returning id into l;
    
    perform pg_temp.mk_quiz(f3, m, l, 'Quiz : Calculer sa marge', $j$[
      {"q":"Vous achetez un article 2 000 FCFA. Le transport coûte 500 FCFA. Vous le vendez 3 000 FCFA. Quelle est votre marge ?","expl":"Le coût total est de 2 500 FCFA (2000+500). La marge est donc de 3 000 - 2 500 = 500 FCFA.","opts":[["1 000 FCFA",false,"Il faut déduire les frais de transport."],["500 FCFA",true,null],["2 500 FCFA",false,"C'est le coût total, pas la marge."]]}
    ]$j$);

    insert into public.formation_modules(formation_id, title, description, position) values (f3, 'Encaisser avec Mobile Money', 'Gérer l''argent de vos ventes.', 2) returning id into m;
    
    insert into public.lessons(module_id, title, slug, description, content, position, estimated_duration, status, published_at) values
     (m, 'Sécuriser ses paiements', 'securiser-paiements', 'Éviter les arnaques et gérer les preuves de paiement.', $j$[
       {"type":"heading","text":"Les règles d'or du Mobile Money"},
       {"type":"text","text":"Le Mobile Money (Orange Money, MTN MoMo, Wave, Moov Money) est le moyen de paiement le plus utilisé en Afrique. Mais il faut être prudent."},
       {"type":"list","items":[
         "✅ Demandez toujours la capture d'écran de la confirmation de transfert.",
         "✅ Vérifiez que le nom sur la capture correspond bien à votre compte.",
         "✅ Utilisez un compte professionnel dédié à votre business si possible.",
         "❌ Ne donnez jamais votre code PIN à un acheteur, même s'il prétend être un agent."
       ]},
       {"type":"warning","text":"Les captures d'écran peuvent être falsifiées. Le meilleur moyen de vérifier est de regarder directement votre propre application Mobile Money pour voir si l'argent est arrivé."}]$j$, 1, 8, 'published', now()) returning id into l;
    
    perform pg_temp.mk_quiz(f3, m, l, 'Quiz : Sécurité Mobile Money', $j$[
      {"q":"Un client vous envoie une capture d'écran montrant qu'il a payé, mais vous n'avez rien reçu sur votre téléphone. Que faites-vous ?","expl":"Les captures d'écran sont faciles à falsifier. Seul le solde affiché dans VOTRE application fait foi.","opts":[["Je lui livre le produit car j'ai la preuve",false,"C'est dangereux, la capture peut être fausse."],["J'attends de voir l'argent sur mon propre compte avant de livrer",true,null],["Je lui demande son code PIN pour vérifier",false,"Ne demandez JAMAIS de code PIN."]]}
    ]$j$);
  end if;

end $$;