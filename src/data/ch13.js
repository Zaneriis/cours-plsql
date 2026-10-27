/* Chapitre 13 : flashcards de révision (tout le programme) et quiz de lecture de code. */
FLASH.push(
  /* ---------- Architecture ---------- */
  { t: "Architecture", q: "Quelle est la différence entre SQL et PL/SQL ?",
    a: "<p>SQL est déclaratif : on décrit le résultat voulu, un ordre à la fois. PL/SQL est procédural : variables, conditions, boucles, exceptions autour du SQL. Le moteur PL/SQL exécute le code procédural et délègue chaque ordre SQL au moteur SQL.</p>" },
  { t: "Architecture", q: "Qu'est-ce qu'un changement de contexte ?",
    a: "<p>Le passage du moteur PL/SQL au moteur SQL (et retour) à chaque ordre SQL lancé depuis PL/SQL, ou à chaque appel de fonction PL/SQL depuis une requête. Un <code>UPDATE</code> dans une boucle de 100 000 tours en coûte 100 000. On le réduit avec un ordre ensembliste, <code>BULK COLLECT</code> / <code>FORALL</code>, ou <code>PRAGMA UDF</code> (12c).</p>" },
  { t: "Architecture", q: "Que devient une procédure quand on modifie une table qu'elle utilise ?",
    a: "<p>Elle peut passer <code>INVALID</code>. Oracle la recompile automatiquement au prochain appel ; si la recompilation échoue (colonne supprimée), l'appel lève une erreur. On vérifie avec <code>USER_OBJECTS.STATUS</code>.</p>" },

  /* ---------- NULL et types ---------- */
  { t: "NULL", q: "Que vaut <code>NULL = NULL</code> ? Quelle branche prend <code>IF l_x &gt; 0 THEN … ELSE … END IF</code> si <code>l_x</code> est NULL ?",
    a: "<p>NULL (logique à trois valeurs), donc ni TRUE ni FALSE. Un <code>IF</code> n'entre que sur TRUE : c'est la branche <code>ELSE</code> qui s'exécute. On teste avec <code>IS NULL</code> ou on neutralise avec <code>NVL</code>.</p>" },
  { t: "NULL", q: "Que vaut <code>''</code> dans Oracle ? Et <code>'A' || NULL</code> ?",
    a: "<p>La chaîne vide <em>est</em> NULL dans Oracle : <code>'' IS NULL</code> est vrai. La concaténation, elle, ignore NULL : <code>'A' || NULL</code> donne <code>'A'</code>.</p>" },
  { t: "NULL", q: "Pourquoi <code>WHERE dept_id NOT IN (SELECT dept_id FROM employes)</code> peut-il ne rien renvoyer ?",
    a: "<p>Si la sous-requête renvoie un seul NULL, <code>x NOT IN (…, NULL)</code> ne vaut jamais TRUE (FALSE si <code>x</code> est dans la liste, NULL sinon) : aucune ligne n'est retenue. On écrit <code>NOT EXISTS</code>, ou on filtre <code>WHERE dept_id IS NOT NULL</code> dans la sous-requête.</p>" },
  { t: "NULL", q: "Différence entre <code>NVL</code> et <code>COALESCE</code> ?",
    a: "<p><code>NVL(a, b)</code> prend deux arguments et évalue toujours les deux. <code>COALESCE(a, b, c…)</code> accepte une liste, renvoie la première valeur non nulle et s'arrête dès qu'il la trouve. <code>COALESCE</code> est standard ANSI.</p>" },
  { t: "Types", q: "À quoi servent <code>%TYPE</code> et <code>%ROWTYPE</code> ?",
    a: "<p>À ancrer une variable sur une colonne (<code>l_sal employes.salaire%TYPE</code>) ou un record sur une ligne de table ou de curseur (<code>l_emp employes%ROWTYPE</code>). Si la colonne change de taille ou de type, le code suit à la recompilation.</p>" },

  /* ---------- Curseurs ---------- */
  { t: "Curseurs", q: "Quelles exceptions peut lever un <code>SELECT … INTO</code> ? Et <code>SELECT COUNT(*) INTO</code> ?",
    a: "<p><code>NO_DATA_FOUND</code> (ORA-01403) si aucune ligne, <code>TOO_MANY_ROWS</code> (ORA-01422) si plusieurs. Un agrégat sans <code>GROUP BY</code> renvoie toujours une ligne : <code>COUNT(*)</code> donne 0 et <code>MAX</code> donne NULL, sans exception.</p>" },
  { t: "Curseurs", q: "Un <code>UPDATE</code> qui ne touche aucune ligne lève-t-il une exception ?",
    a: "<p>Non. Il faut tester <code>SQL%ROWCOUNT = 0</code> ou <code>SQL%NOTFOUND</code> juste après l'ordre, avant tout autre SQL (ces attributs décrivent le <em>dernier</em> ordre exécuté).</p>" },
  { t: "Curseurs", q: "Curseur implicite, explicite, boucle FOR de curseur : quelle différence ?",
    a: "<p>L'implicite est géré par Oracle pour chaque <code>SELECT INTO</code> ou DML (attributs <code>SQL%</code>). L'explicite est déclaré et piloté à la main (<code>OPEN</code> / <code>FETCH</code> / <code>CLOSE</code>, attributs <code>c%</code>). La boucle <code>FOR r IN c LOOP</code> ouvre, lit et ferme toute seule, même en cas d'exception.</p>" },
  { t: "Curseurs", q: "Où placer <code>EXIT WHEN c%NOTFOUND</code> dans une boucle <code>FETCH</code> ?",
    a: "<p>Immédiatement après le <code>FETCH</code>. Placé en fin de boucle, la dernière ligne est traitée deux fois : le <code>FETCH</code> qui échoue ne vide pas les variables.</p>" },
  { t: "Curseurs", q: "Qu'est-ce qu'un <code>REF CURSOR</code> ?",
    a: "<p>Une variable qui pointe vers un curseur ouvert, dont la requête est choisie à l'exécution (<code>OPEN l_rc FOR …</code>). Usage typique : une procédure renvoie un <code>SYS_REFCURSOR</code> en <code>OUT</code> à une application Java ou .NET, qui lit les lignes au fil de l'eau.</p>" },
  { t: "Curseurs", q: "À quoi servent <code>FOR UPDATE</code> et <code>WHERE CURRENT OF</code> ?",
    a: "<p><code>FOR UPDATE</code> verrouille les lignes à l'ouverture du curseur (pas de mise à jour perdue). <code>WHERE CURRENT OF c</code> met à jour la ligne courante sans nouvelle recherche. Variantes : <code>NOWAIT</code>, <code>WAIT n</code>, <code>SKIP LOCKED</code>.</p>" },

  /* ---------- Exceptions ---------- */
  { t: "Exceptions", q: "Différence entre <code>RAISE</code> et <code>RAISE_APPLICATION_ERROR</code> ?",
    a: "<p><code>RAISE</code> lève une exception nommée, ou re-lève l'exception courante s'il est seul dans un gestionnaire. <code>RAISE_APPLICATION_ERROR(-20001, 'message')</code> crée une erreur ORA- avec un code entre -20000 et -20999 et un message lisible par l'application cliente.</p>" },
  { t: "Exceptions", q: "Pourquoi <code>WHEN OTHERS THEN NULL</code> est-il un anti-pattern ?",
    a: "<p>Il avale toutes les erreurs, y compris les imprévues : le programme « réussit », l'appelant peut valider des données incohérentes et personne n'est prévenu. Au minimum : journaliser (transaction autonome) puis <code>RAISE;</code>. Si les avertissements sont activés (<code>PLSQL_WARNINGS</code>), le compilateur le signale (PLW-06009).</p>" },
  { t: "Exceptions", q: "Comment retrouver le numéro de ligne d'une erreur ?",
    a: "<p><code>DBMS_UTILITY.FORMAT_ERROR_BACKTRACE</code> dans le gestionnaire, avant tout <code>RAISE</code> qui ferait perdre l'origine. <code>SQLERRM</code> ne donne que le message. Depuis 12c, <code>UTL_CALL_STACK</code> donne la même information de façon structurée.</p>" },
  { t: "Exceptions", q: "À quoi sert <code>PRAGMA EXCEPTION_INIT</code> ?",
    a: "<p>À donner un nom à une erreur Oracle qui n'en a pas, pour l'intercepter proprement : <code>e_fk EXCEPTION; PRAGMA EXCEPTION_INIT(e_fk, -2292);</code> puis <code>WHEN e_fk THEN …</code>.</p>" },
  { t: "Exceptions", q: "Une exception levée dans la section <code>DECLARE</code> est-elle traitée par la section <code>EXCEPTION</code> du même bloc ?",
    a: "<p>Non. Une erreur d'initialisation (<code>l_n NUMBER(2) := 100;</code>) part directement au bloc englobant. De même, une exception levée dans un gestionnaire remonte au bloc supérieur.</p>" },

  /* ---------- Procédures et fonctions ---------- */
  { t: "Sous-programmes", q: "Procédure ou fonction : comment choisir ? Que faut-il pour appeler une fonction depuis SQL ?",
    a: "<p>Une fonction calcule et renvoie une valeur ; une procédure réalise une action. Appelée depuis SQL, une fonction ne doit avoir que des paramètres <code>IN</code> de types SQL, renvoyer un type SQL, et ne pas faire de DML ni de <code>COMMIT</code> (ORA-14551 depuis un <code>SELECT</code>).</p>" },
  { t: "Sous-programmes", q: "Que deviennent les paramètres <code>OUT</code> si la procédure se termine par une exception ? Et avec <code>NOCOPY</code> ?",
    a: "<p>Ils sont passés par copie et recopiés seulement à la sortie normale : la variable de l'appelant garde son ancienne valeur. Avec <code>NOCOPY</code> (simple indication), le passage se fait par référence : plus rapide pour une grosse collection, mais les modifications partielles restent visibles.</p>" },
  { t: "Sous-programmes", q: "Différence entre <code>DETERMINISTIC</code> et <code>RESULT_CACHE</code> ?",
    a: "<p><code>DETERMINISTIC</code> est une promesse à l'optimiseur (mêmes entrées, même résultat), exigée pour un index sur fonction ; le bénéfice reste limité à la requête en cours. <code>RESULT_CACHE</code> (11g) stocke vraiment les résultats en mémoire partagée entre sessions, invalidés quand les tables sources changent.</p>" },
  { t: "Sous-programmes", q: "Pourquoi une requête qui marche dans SQL Developer échoue-t-elle dans ma procédure avec ORA-00942 ?",
    a: "<p>Dans une unité <code>AUTHID DEFINER</code> (le défaut), les privilèges obtenus via un <strong>rôle</strong> sont ignorés. Il faut un <code>GRANT</code> direct à l'utilisateur propriétaire. Avec <code>AUTHID CURRENT_USER</code>, ce sont les droits de l'appelant qui s'appliquent.</p>" },

  /* ---------- Packages ---------- */
  { t: "Packages", q: "Pourquoi regrouper son code en packages ?",
    a: "<p>Encapsulation (spécification publique, corps privé), surcharge, variables et curseurs de session, chargement en mémoire en une fois, et surtout <strong>dépendances</strong> : modifier le corps n'invalide pas les appelants, seule la spécification compte.</p>" },
  { t: "Packages", q: "Que signifie ORA-04068 ?",
    a: "<p>« Existing state of packages has been discarded » : le package a été recompilé alors qu'une session avait initialisé ses variables globales. Le premier appel suivant échoue, le second passe. On l'évite en limitant l'état de package, ou avec l'<em>Edition-Based Redefinition</em> pour les déploiements à chaud.</p>" },
  { t: "Packages", q: "Une variable de package est-elle partagée entre utilisateurs ?",
    a: "<p>Non, elle vit dans la session. Elle n'est pas non plus transactionnelle (un <code>ROLLBACK</code> ne la restaure pas). Piège : avec un pool de connexions, deux utilisateurs web qui réutilisent la même session partagent sa valeur.</p>" },

  /* ---------- Collections ---------- */
  { t: "Collections", q: "Quels sont les trois types de collections et leurs différences ?",
    a: "<p><strong>Tableau associatif</strong> (<code>INDEX BY</code>) : PL/SQL seul, sans initialisation, indexé par entier ou chaîne. <strong>Table imbriquée</strong> : à initialiser, peut devenir creuse, utilisable comme type SQL. <strong>VARRAY</strong> : taille maximale, toujours dense, type SQL possible.</p>" },
  { t: "Collections", q: "Différence entre <code>COUNT</code> et <code>LAST</code> ? Comment parcourir une collection creuse ?",
    a: "<p><code>COUNT</code> = nombre d'éléments, <code>LAST</code> = plus grand indice : différents dès qu'il y a des trous. Parcours sûr : <code>i := c.FIRST; WHILE i IS NOT NULL LOOP … i := c.NEXT(i); END LOOP;</code>. En écriture de masse : <code>FORALL i IN INDICES OF c</code>.</p>" },

  /* ---------- Bulk ---------- */
  { t: "Bulk", q: "Pourquoi mettre <code>LIMIT</code> à un <code>BULK COLLECT</code>, et comment sortir de la boucle ?",
    a: "<p>Pour borner la mémoire de session (PGA) : 100 à 1 000 lignes par lot suffisent. On sort avec <code>EXIT WHEN l_tab.COUNT = 0</code> juste après le <code>FETCH</code> (ou <code>EXIT WHEN c%NOTFOUND</code> en <strong>fin</strong> de boucle), sinon le dernier lot incomplet est perdu.</p>" },
  { t: "Bulk", q: "<code>FORALL</code> est-il une boucle ? Que fait <code>SAVE EXCEPTIONS</code> ?",
    a: "<p>Non : un seul ordre DML envoyé avec un tableau de valeurs, sans logique procédurale. Avec <code>SAVE EXCEPTIONS</code>, les lignes en erreur n'arrêtent pas les autres ; à la fin, ORA-24381 est levée et <code>SQL%BULK_EXCEPTIONS(j).ERROR_INDEX</code> / <code>.ERROR_CODE</code> décrivent chaque échec.</p>" },
  { t: "Bulk", q: "Qu'est-ce qu'une fonction <code>PIPELINED</code> ?",
    a: "<p>Une fonction de table qui renvoie ses lignes au fur et à mesure avec <code>PIPE ROW</code>, interrogeable par <code>SELECT * FROM TABLE(f(…))</code>. La première ligne arrive tout de suite et la collection complète n'est jamais en mémoire.</p>" },

  /* ---------- Triggers ---------- */
  { t: "Triggers", q: "Qu'est-ce qu'une table mutante et comment s'en sortir ?",
    a: "<p>Un trigger de ligne qui lit ou modifie la table en cours de modification lève ORA-04091. Solutions : trigger composé (11g) qui note les lignes en <code>AFTER EACH ROW</code> et contrôle en <code>AFTER STATEMENT</code>, ou sortir la règle du trigger (API, contrainte déclarative).</p>" },
  { t: "Triggers", q: "Peut-on modifier <code>:NEW</code> dans un trigger AFTER ? Faire un <code>COMMIT</code> dans un trigger ?",
    a: "<p><code>:NEW</code> n'est modifiable qu'en <code>BEFORE … FOR EACH ROW</code> (sinon ORA-04084). Un <code>COMMIT</code> dans un trigger lève ORA-04092, sauf dans un trigger en transaction autonome, réservé à la journalisation.</p>" },
  { t: "Triggers", q: "Dans quel ordre se déclenchent les triggers DML ?",
    a: "<p><code>BEFORE STATEMENT</code>, puis pour chaque ligne <code>BEFORE ROW</code>, écriture de la ligne, <code>AFTER ROW</code>, enfin <code>AFTER STATEMENT</code>. Entre deux triggers du même type, l'ordre n'est garanti qu'avec la clause <code>FOLLOWS</code> (11g).</p>" },

  /* ---------- Transactions et SQL dynamique ---------- */
  { t: "Transactions", q: "Qu'est-ce qu'une transaction autonome ? Un cas d'usage légitime ?",
    a: "<p>Un sous-programme marqué <code>PRAGMA AUTONOMOUS_TRANSACTION</code>, exécuté dans une transaction indépendante qu'il doit valider ou annuler lui-même (sinon ORA-06519). Cas légitime : journaliser une erreur qui doit survivre au <code>ROLLBACK</code> de l'appelant.</p>" },
  { t: "Transactions", q: "Différence entre <code>TRUNCATE</code> et <code>DELETE</code> ?",
    a: "<p><code>DELETE</code> est un DML : <code>WHERE</code> possible, undo, annulable, triggers déclenchés. <code>TRUNCATE</code> est un DDL : très rapide, commit implicite, pas de rollback, pas de trigger DML, échoue si une clé étrangère active référence la table.</p>" },
  { t: "SQL dynamique", q: "Comment écrire du SQL dynamique sans risque d'injection ?",
    a: "<p>Les <strong>valeurs</strong> passent en variables liées : <code>EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM employes WHERE dept_id = :d' INTO l_n USING p_dept;</code>. Les <strong>noms d'objets</strong> ne peuvent pas être liés : on les valide avec <code>DBMS_ASSERT</code> ou une liste blanche. Bonus : les variables liées permettent le partage du curseur.</p>" },

  /* ---------- Performance ---------- */
  { t: "Performance", q: "Un traitement PL/SQL est lent : par quoi commences-tu ?",
    a: "<p>Mesurer avant de modifier : logs horodatés, <code>DBMS_APPLICATION_INFO</code>, profileur <code>DBMS_HPROF</code> pour savoir où passe le temps. Si c'est une requête : plan réel avec <code>DBMS_XPLAN.DISPLAY_CURSOR</code> (comparer E-Rows et A-Rows), statistiques. Ensuite : SQL ensembliste, <code>BULK COLLECT</code> / <code>FORALL</code>, plus de <code>COMMIT</code> ligne à ligne.</p>" },
  { t: "Performance", q: "Pourquoi <code>WHERE TRUNC(date_embauche) = DATE '2021-01-11'</code> peut-il être lent ?",
    a: "<p>Une fonction appliquée à une colonne indexée empêche l'usage de l'index (sauf index sur fonction). Réécriture : <code>WHERE date_embauche &gt;= DATE '2021-01-11' AND date_embauche &lt; DATE '2021-01-12'</code>. Même piège avec une conversion implicite.</p>" },

  /* ---------- SQL d'entretien ---------- */
  { t: "SQL", q: "<code>ROW_NUMBER</code>, <code>RANK</code>, <code>DENSE_RANK</code> : que donnent-elles pour les salaires 5000, 5000, 4000 ?",
    a: "<p><code>ROW_NUMBER</code> : 1, 2, 3. <code>RANK</code> : 1, 1, 3. <code>DENSE_RANK</code> : 1, 1, 2. Attention, en <code>ORDER BY … DESC</code> Oracle place les NULL <strong>en premier</strong> : ajoute <code>NULLS LAST</code>.</p>" },
  { t: "SQL", q: "Différence entre <code>WHERE</code> et <code>HAVING</code> ? Entre <code>GROUP BY</code> et une fonction analytique ?",
    a: "<p><code>WHERE</code> filtre les lignes avant l'agrégation, <code>HAVING</code> filtre les groupes après. <code>GROUP BY</code> réduit à une ligne par groupe ; une fonction analytique (<code>AVG(…) OVER (PARTITION BY …)</code>) calcule par groupe en gardant toutes les lignes.</p>" },
  { t: "SQL", q: "<code>COUNT(*)</code> ou <code>COUNT(e.emp_id)</code> après un <code>LEFT JOIN</code> ?",
    a: "<p><code>COUNT(*)</code> compte les lignes, y compris celle complétée par des NULL : un département vide affiche 1. <code>COUNT(e.emp_id)</code> ignore les NULL et affiche 0. Autre piège : une condition sur la table de droite dans le <code>WHERE</code> transforme la jointure externe en jointure interne ; mets-la dans le <code>ON</code>.</p>" },
  { t: "SQL", q: "Différence entre <code>UNION</code> et <code>UNION ALL</code> ?",
    a: "<p><code>UNION</code> supprime les doublons, ce qui coûte un tri ou un hachage. <code>UNION ALL</code> garde tout et est plus rapide : c'est le bon choix quand les ensembles sont disjoints ou que les doublons sont voulus.</p>" }
);

QUIZ.ch13 = [
  { q: "<code>SELECT MAX(salaire) INTO l_max FROM employes WHERE dept_id = 40;</code> (département vide). Que se passe-t-il ?",
    o: ["NO_DATA_FOUND est levée", "l_max vaut 0", "l_max vaut NULL", "TOO_MANY_ROWS est levée"], a: 2,
    w: "Un agrégat sans GROUP BY renvoie toujours une ligne : MAX sur zéro ligne donne NULL, sans exception." },
  { q: "Une procédure déclare un paramètre <code>dept_id</code> et exécute <code>DELETE FROM employes WHERE dept_id = dept_id;</code>. Résultat ?",
    o: ["Seul le département passé en paramètre est vidé", "Erreur de compilation : nom ambigu", "Tous les employés dont dept_id n'est pas NULL sont supprimés", "Aucune ligne supprimée"], a: 2,
    w: "Dans un ordre SQL, la colonne masque la variable de même nom : la condition compare la colonne à elle-même. D'où les préfixes p_ et l_." },
  { q: "Un <code>FORALL … SAVE EXCEPTIONS</code> de 1 000 lignes rencontre 3 erreurs. Que se passe-t-il ?",
    o: ["Le FORALL s'arrête à la première erreur", "Les 997 autres lignes sont traitées, puis ORA-24381 est levée", "Les 997 lignes sont traitées et aucune exception n'est levée", "Tout le lot est annulé"], a: 1,
    w: "SAVE EXCEPTIONS reporte les erreurs à la fin : ORA-24381, puis SQL%BULK_EXCEPTIONS donne l'indice et le code de chaque échec." },
  { q: "Que renvoie <code>SELECT salaire FROM employes ORDER BY salaire DESC FETCH FIRST 1 ROW ONLY</code> si un employé a un salaire NULL ?",
    o: ["Le salaire le plus élevé", "NULL", "Une erreur", "Aucune ligne"], a: 1,
    w: "Oracle trie les NULL comme des valeurs plus grandes que toutes les autres : en DESC, ils arrivent en premier. Il faut NULLS LAST ou WHERE salaire IS NOT NULL." },
  { q: "Dans une procédure, un <code>COMMIT</code> est exécuté juste après un <code>UPDATE</code>, puis une exception survient et l'appelant fait <code>ROLLBACK</code>. L'<code>UPDATE</code> est-il annulé ?",
    o: ["Oui, le ROLLBACK annule tout depuis le début de l'appel", "Non, il a été validé par le COMMIT", "Oui, si la procédure est AUTHID CURRENT_USER", "Seulement si l'exception n'est pas traitée"], a: 1,
    w: "Un COMMIT termine la transaction, où qu'il soit. C'est pourquoi on laisse en général la décision de valider à l'appelant." }
];
