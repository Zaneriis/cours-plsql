/* Données des quiz, animations pas à pas et flashcards. Chaque chapitre a son propre fichier src/data/chNN.js. */
window.QUIZ = {};
window.STEPPERS = {};
window.FLASH = [];

/* ---- ch00 ---- */
QUIZ.ch00 = [
  { q: "Ton bloc contient <code>DBMS_OUTPUT.PUT_LINE('ok')</code>, il se termine sans erreur, mais rien ne s'affiche. Cause la plus probable ?",
    o: ["Il manque un COMMIT après le bloc", "SET SERVEROUTPUT ON n'a pas été exécuté dans la session", "DBMS_OUTPUT n'est disponible qu'en 23ai", "Le tampon est limité à 255 caractères"], a: 1,
    w: "PUT_LINE écrit dans un tampon côté serveur ; le client ne le lit et ne l'affiche que si SERVEROUTPUT est activé pour la session. COMMIT n'a aucun rapport avec l'affichage." },
  { q: "Avec le conteneur <code>gvenzl/oracle-free</code>, à quel service te connectes-tu pour créer tes tables ?",
    o: ["FREE", "FREEPDB1", "XE", "CDB$ROOT"], a: 1,
    w: "FREEPDB1 est la base enfichable (PDB) où l'image crée l'utilisateur applicatif. FREE est le conteneur racine : un CREATE USER classique y échoue avec ORA-65096." },
  { q: "Dans un script SQL*Plus ou SQLcl, à quoi sert le <code>/</code> seul sur sa ligne après <code>END;</code> ?",
    o: ["C'est la fin obligatoire de tout bloc PL/SQL", "Il valide la transaction comme un COMMIT", "Il demande au client d'envoyer le bloc au serveur pour exécution", "Il commente la ligne suivante"], a: 2,
    w: "Le / est une commande du client, pas du PL/SQL : elle envoie le contenu du tampon (le bloc) au serveur. END; termine le bloc côté langage." },
  { q: "<code>SELECT table_name FROM user_tables WHERE table_name = 'employes';</code> ne renvoie aucune ligne alors que la table existe. Pourquoi ?",
    o: ["USER_TABLES ne liste que les tables système", "Il faut interroger ALL_TABLES", "Les noms d'objets sont stockés en majuscules dans le dictionnaire", "La table n'est visible qu'après un COMMIT"], a: 2,
    w: "Sans guillemets doubles à la création, Oracle stocke le nom en majuscules : il faut filtrer sur 'EMPLOYES'. Un CREATE TABLE fait de toute façon un COMMIT implicite." }
];

/* ---- ch01 ---- */
QUIZ.ch01 = [
  { q: "Quelle section d'un bloc PL/SQL est obligatoire ?", o: ["DECLARE", "BEGIN … END", "EXCEPTION", "Aucune"], a: 1,
    w: "Seule la section exécutable BEGIN … END est obligatoire (avec au moins une instruction, NULL; suffit). DECLARE et EXCEPTION sont optionnelles." },
  { q: "Que provoque chaque ordre SQL exécuté depuis une boucle PL/SQL ?", o: ["Un aller-retour réseau", "Un changement de contexte entre moteur PL/SQL et moteur SQL", "Un COMMIT implicite", "Une recompilation"], a: 1,
    w: "Le bloc est envoyé en un seul appel réseau, mais chaque ordre SQL passe du moteur PL/SQL au moteur SQL : c'est le changement de contexte." },
  { q: "Dans quelle vue lit-on les erreurs de compilation d'une procédure ?", o: ["USER_SOURCE", "USER_OBJECTS", "USER_ERRORS", "V$SESSION"], a: 2,
    w: "USER_ERRORS contient ligne, position et texte des erreurs ; SHOW ERRORS en est le raccourci dans SQL*Plus / SQL Developer. USER_OBJECTS ne donne que l'état VALID / INVALID." },
  { q: "Un sous-bloc déclare l_x, déjà déclarée dans le bloc externe étiqueté <code>&lt;&lt;ext&gt;&gt;</code>. Comment lire la variable externe depuis le sous-bloc ?", o: ["Impossible", "ext.l_x", "OUTER.l_x", "l_x%OUTER"], a: 1,
    w: "On qualifie la variable par l'étiquette du bloc externe : ext.l_x." },
  { q: "Un bloc anonyme contient <code>SELECT nom FROM employes WHERE emp_id = 100;</code> sans INTO. Que se passe-t-il ?", o: ["Le nom s'affiche dans la sortie", "ORA-01403 à l'exécution", "ORA-06550 suivie de PLS-00428 : le bloc ne compile pas", "La requête est ignorée silencieusement"], a: 2,
    w: "C'est une erreur de compilation (PLS-00428). Pour un bloc anonyme, elle est enveloppée dans ORA-06550, qui donne la ligne et la colonne. Aucune instruction du bloc ne s'exécute." },
  { q: "Un traitement de 10 minutes appelle DBMS_OUTPUT.PUT_LINE à chaque tour de boucle. Quand les lignes apparaissent-elles dans SQL Developer ?", o: ["Au fur et à mesure", "Toutes à la fin de l'appel", "À chaque COMMIT", "Jamais sans DBMS_OUTPUT.FLUSH"], a: 1,
    w: "PUT_LINE remplit un tampon côté serveur ; le client le lit avec GET_LINES une fois l'appel terminé. DBMS_OUTPUT.FLUSH n'existe pas. Pour suivre l'avancement : DBMS_APPLICATION_INFO ou une table de log." }
];
STEPPERS["ch01-portee"] = {
  title: "Portée et masquage dans des blocs imbriqués",
  code: `
<<externe>>
DECLARE
  l_x NUMBER := 10;
BEGIN
  DECLARE
    l_x NUMBER := 20;   -- masque externe.l_x
    l_y NUMBER := 5;
  BEGIN
    externe.l_x := externe.l_x + l_y;
    DBMS_OUTPUT.PUT_LINE('interne : ' || l_x || ', externe : ' || externe.l_x);
  END;
  -- l_y n'existe plus ici : la référencer donnerait PLS-00201
  DBMS_OUTPUT.PUT_LINE('après : ' || l_x);
END externe;`,
  steps: [
    { l: [1, 2, 3], n: "Le bloc externe porte l'étiquette <code>externe</code>. Sa section DECLARE crée <code>l_x</code> = 10.", v: { "externe.l_x": "10" } },
    { l: [5, 6, 7], n: "Le sous-bloc déclare <strong>sa propre</strong> <code>l_x</code> = 20 et <code>l_y</code> = 5. À partir d'ici, le nom <code>l_x</code> seul désigne la variable interne : l'externe est <strong>masquée</strong>, mais toujours vivante.", v: { "l_x (interne)": "20", "l_y": "5" } },
    { l: 9, n: "<code>externe.l_x</code> qualifie le nom par l'étiquette : on modifie bien la variable <em>externe</em> (10 + 5). <code>l_y</code>, déclarée dans le sous-bloc, est visible.", v: { "externe.l_x": "15" } },
    { l: 10, n: "<code>l_x</code> seul lit la variable interne (20) ; <code>externe.l_x</code> lit l'externe (15).", o: "interne : 20, externe : 15" },
    { l: 11, n: "Fin du sous-bloc : ses variables <code>l_x</code> (interne) et <code>l_y</code> disparaissent. Plus rien ne masque <code>externe.l_x</code>.", v: { "l_x (interne)": "hors portée", "l_y": "hors portée" } },
    { l: [12, 13], n: "<code>l_x</code> désigne maintenant la variable externe, modifiée dans le sous-bloc : 15. Écrire <code>l_y</code> ici ferait échouer la <strong>compilation</strong> de tout le bloc (PLS-00201).", o: "après : 15" },
    { l: 14, n: "Fin du bloc externe. L'étiquette répétée après END est facultative mais aide à repérer les blocs longs.", v: { "externe.l_x": "hors portée" } }
  ]
};

/* ---- ch02 ---- */
QUIZ.ch02 = [
  { q: "Que vaut <code>NULL = NULL</code> en PL/SQL ?", o: ["TRUE", "FALSE", "NULL", "Erreur de compilation"], a: 2,
    w: "Une comparaison avec une valeur inconnue donne NULL. Il faut tester avec IS NULL." },
  { q: "Que vaut <code>'Bonjour' || NULL</code> ?", o: ["NULL", "'Bonjour'", "'BonjourNULL'", "Une erreur"], a: 1,
    w: "Particularité Oracle : la concaténation ignore NULL." },
  { q: "Quelle déclaration suit automatiquement un changement de taille de la colonne employes.nom ?", o: ["l_nom VARCHAR2(50);", "l_nom employes.nom%TYPE;", "l_nom CHAR(50);", "l_nom VARCHAR2;"], a: 1,
    w: "%TYPE ancre la variable sur la colonne : le code suit le schéma." },
  { q: "Dans <code>IF l_x > 0 THEN … ELSE … END IF;</code> avec l_x NULL, quelle branche s'exécute ?", o: ["THEN", "ELSE", "Aucune", "Erreur VALUE_ERROR"], a: 1,
    w: "La condition vaut NULL, traitée comme non vraie : on passe dans ELSE." },
  { q: "Quelle est la limite d'un VARCHAR2 en PL/SQL ?", o: ["2 000 octets", "4 000 octets", "32 767 octets", "Illimitée"], a: 2,
    w: "32 767 octets en PL/SQL, alors qu'une colonne SQL est limitée à 4 000 octets (32 767 en mode MAX_STRING_SIZE = EXTENDED)." },
  { q: "Que renvoie <code>DATE '2024-03-01' - DATE '2024-02-28'</code> ?", o: ["1", "2", "Un INTERVAL de 2 jours", "Une erreur : on ne soustrait pas deux dates"], a: 1,
    w: "La différence de deux DATE est un NUMBER de jours. 2024 est bissextile : 28/02, 29/02, 01/03, donc 2. Entre deux TIMESTAMP, on obtiendrait un INTERVAL DAY TO SECOND." }
];
STEPPERS["null-if"] = {
  title: "Un IF face à NULL",
  code: `
DECLARE
  l_comm  NUMBER;              -- non initialisée : NULL
  l_seuil NUMBER := 500;
BEGIN
  IF l_comm > l_seuil THEN
    DBMS_OUTPUT.PUT_LINE('Grosse commission');
  ELSIF NOT (l_comm > l_seuil) THEN
    DBMS_OUTPUT.PUT_LINE('Petite commission');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Commission inconnue');
  END IF;
  l_comm := NVL(l_comm, 0);
  DBMS_OUTPUT.PUT_LINE('Après NVL : ' || l_comm);
END;`,
  steps: [
    { l: [2, 3], n: "Déclarations : <code>l_comm</code> n'a pas de valeur initiale, elle vaut donc NULL.", v: { l_comm: "NULL", l_seuil: "500" } },
    { l: 5, n: "<code>NULL > 500</code> donne NULL. Un IF n'entre que si la condition est TRUE : NULL n'est pas TRUE, on passe à la branche suivante.", v: { "condition": "NULL" } },
    { l: 7, n: "<code>NOT (NULL)</code> reste NULL : NULL n'est pas FALSE, sa négation n'est donc pas TRUE. Les deux branches « contraires » sont sautées.", v: { "condition": "NULL" } },
    { l: [9, 10], n: "Aucune condition n'était vraie : la branche ELSE s'exécute.", o: "Commission inconnue" },
    { l: 12, n: "<code>NVL</code> remplace NULL par 0.", v: { l_comm: "0" } },
    { l: 13, n: "La valeur est maintenant connue : <code>0 > 500</code> vaudrait FALSE et le même IF afficherait « Petite commission ».", o: "Après NVL : 0" }
  ]
};

/* ---- ch03 ---- */
QUIZ.ch03 = [
  { q: "Combien de fois s'exécute <code>FOR i IN 5 .. 1 LOOP</code> ?", o: ["5 fois, en descendant", "0 fois", "1 fois", "Erreur de compilation"], a: 1,
    w: "Si la borne basse dépasse la borne haute, la boucle ne s'exécute pas, sans erreur. Pour descendre : FOR i IN REVERSE 1 .. 5." },
  { q: "Que se passe-t-il si on écrit <code>i := 10;</code> dans une boucle FOR i ?", o: ["La boucle s'arrête", "La boucle saute à 10", "Erreur de compilation PLS-00363", "Rien"], a: 2,
    w: "L'indice d'une boucle FOR est en lecture seule : le bloc ne compile pas." },
  { q: "Une instruction <code>CASE … END CASE;</code> sans ELSE ne trouve aucune branche. Résultat ?", o: ["Rien ne se passe", "Elle renvoie NULL", "Exception CASE_NOT_FOUND", "Exception NO_DATA_FOUND"], a: 2,
    w: "L'instruction CASE lève CASE_NOT_FOUND (ORA-06592). L'expression CASE, elle, renverrait NULL." },
  { q: "Comment quitter deux boucles imbriquées d'un coup ?", o: ["EXIT; EXIT;", "EXIT nom_etiquette; avec la boucle externe étiquetée", "RETURN uniquement", "C'est impossible"], a: 1,
    w: "On étiquette la boucle externe &lt;&lt;lignes&gt;&gt; et on écrit EXIT lignes; (ou EXIT lignes WHEN …). Un EXIT seul ne quitte que la boucle la plus interne." },
  { q: "Avec <code>l_nb = 0</code>, que fait <code>IF l_nb > 0 AND l_total / l_nb > 100 THEN</code> ?", o: ["Lève ZERO_DIVIDE", "Passe dans le ELSE sans erreur", "Renvoie NULL et lève VALUE_ERROR", "Ne compile pas"], a: 1,
    w: "Évaluation en court-circuit : l_nb > 0 est faux, donc la division n'est jamais calculée. Dans l'ordre inverse, ZERO_DIVIDE serait levée." },
  { q: "<code>l_max</code> vaut NULL. Combien de tours fait <code>i := 1; WHILE i &lt;= l_max LOOP … i := i + 1; END LOOP;</code> ?", o: ["Aucun", "Un seul", "Une infinité", "Erreur VALUE_ERROR"], a: 0,
    w: "1 &lt;= NULL vaut NULL, donc n'est pas vrai : on n'entre jamais dans la boucle. À l'inverse, un LOOP avec EXIT WHEN i > l_max ne sortirait jamais." }
];
STEPPERS["loop-continue"] = {
  title: "FOR, CONTINUE et EXIT",
  code: `
DECLARE
  l_somme PLS_INTEGER := 0;
BEGIN
  FOR i IN 1 .. 6 LOOP
    CONTINUE WHEN MOD(i, 2) = 0;     -- saute les pairs
    EXIT WHEN i > 4;                 -- sort dès que i dépasse 4
    l_somme := l_somme + i;
    DBMS_OUTPUT.PUT_LINE('i=' || i || ' somme=' || l_somme);
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total : ' || l_somme);
END;`,
  steps: [
    { l: 2, n: "Initialisation de l'accumulateur.", v: { l_somme: "0" } },
    { l: 4, n: "Entrée dans la boucle : les bornes 1 et 6 sont évaluées une seule fois. L'indice i, déclaré implicitement, vaut 1.", v: { i: "1" } },
    { l: 5, n: "MOD(1, 2) = 1 : la condition est fausse, pas de CONTINUE." },
    { l: 6, n: "1 > 4 ? Non : pas d'EXIT." },
    { l: 7, n: "l_somme = 0 + 1.", v: { l_somme: "1" } },
    { l: 8, n: "Affichage.", o: "i=1 somme=1" },
    { l: 4, n: "Itération suivante : i = 2.", v: { i: "2" } },
    { l: 5, n: "MOD(2, 2) = 0 : CONTINUE. Les lignes 6 à 8 sont sautées, on passe directement à l'itération suivante." },
    { l: 4, n: "i = 3.", v: { i: "3" } },
    { l: [5, 6], n: "3 est impair (pas de CONTINUE) et 3 n'est pas > 4 (pas d'EXIT)." },
    { l: [7, 8], n: "l_somme = 1 + 3, puis affichage.", v: { l_somme: "4" }, o: "i=3 somme=4" },
    { l: [4, 5], n: "i = 4 : pair, CONTINUE.", v: { i: "4" } },
    { l: 4, n: "i = 5.", v: { i: "5" } },
    { l: [5, 6], n: "5 est impair, pas de CONTINUE. Mais 5 > 4 : EXIT, on sort de la boucle. L'itération i = 6 n'aura jamais lieu." },
    { l: 10, n: "Après la boucle. L'indice i n'existe plus ici.", v: { i: "(hors portée)" }, o: "Total : 4" }
  ]
};

/* ---- ch04 ---- */
QUIZ.ch04 = [
  { q: "Que se passe-t-il avec <code>SELECT nom INTO l_nom FROM employes WHERE dept_id = 20;</code> ?", o: ["l_nom reçoit le premier nom trouvé", "Exception NO_DATA_FOUND", "Exception TOO_MANY_ROWS", "l_nom reçoit NULL"], a: 2,
    w: "Le département 20 compte 5 employés. SELECT INTO exige exactement une ligne : au-delà, Oracle lève TOO_MANY_ROWS (ORA-01422)." },
  { q: "Le département 40 n'a aucun employé. Que donne <code>SELECT MAX(salaire) INTO l_max FROM employes WHERE dept_id = 40;</code> ?", o: ["Exception NO_DATA_FOUND", "l_max vaut 0", "l_max vaut NULL, sans exception", "Exception VALUE_ERROR"], a: 2,
    w: "Un agrégat sans GROUP BY renvoie toujours une ligne. MAX sur zéro ligne vaut NULL (COUNT vaudrait 0)." },
  { q: "Après <code>UPDATE employes SET salaire = salaire + 100 WHERE emp_id = 999;</code> (employé inexistant), que se passe-t-il ?", o: ["Exception NO_DATA_FOUND", "Aucune exception, SQL%ROWCOUNT vaut 0", "Aucune exception, SQL%ROWCOUNT vaut NULL", "Exception INVALID_CURSOR"], a: 1,
    w: "Un DML qui ne touche aucune ligne ne lève rien. C'est au code de tester SQL%ROWCOUNT = 0 ou SQL%NOTFOUND." },
  { q: "Dans une boucle <code>LOOP FETCH c INTO l_nom; afficher(l_nom); EXIT WHEN c%NOTFOUND; END LOOP;</code>, quel est le symptôme ?", o: ["Boucle infinie", "La première ligne est sautée", "La dernière ligne est traitée deux fois", "INVALID_CURSOR au dernier FETCH"], a: 2,
    w: "Le FETCH qui échoue ne vide pas l_nom : l'ancienne valeur est réaffichée avant le test de sortie. EXIT WHEN doit suivre immédiatement le FETCH." },
  { q: "Dans une boucle <code>LOOP FETCH … END LOOP</code> sur un curseur explicite <code>FOR UPDATE</code>, tu fais un <code>COMMIT</code> à chaque ligne. Que se passe-t-il ?", o: ["Rien, c'est la bonne pratique", "ORA-01002 (fetch out of sequence) au FETCH suivant", "ORA-00054 (resource busy)", "Un interblocage avec ta propre session"], a: 1,
    w: "Le COMMIT libère tous les verrous posés par FOR UPDATE et le curseur ne peut plus être lu : le FETCH suivant lève ORA-01002. On valide après la boucle." },
  { q: "Quel est l'intérêt principal d'une fonction qui renvoie un <code>SYS_REFCURSOR</code> ?", o: ["Charger tout le résultat en mémoire PGA", "Renvoyer au client un curseur ouvert qu'il lira lui-même ligne à ligne", "Rendre la requête plus rapide", "Éviter de fermer le curseur"], a: 1,
    w: "Le client (Java, .NET, Python…) reçoit un pointeur vers le curseur ouvert et lit les lignes au fil de l'eau. Il doit ensuite le fermer, sinon ORA-01000 guette." }
];
STEPPERS["cursor"] = {
  title: "Cycle de vie d'un curseur explicite",
  code: `
DECLARE
  CURSOR cur_tech IS
    SELECT nom, salaire FROM employes
     WHERE poste IN ('DEV', 'DBA') ORDER BY nom;
  l_nom employes.nom%TYPE;
  l_sal employes.salaire%TYPE;
BEGIN
  OPEN cur_tech;
  LOOP
    FETCH cur_tech INTO l_nom, l_sal;
    EXIT WHEN cur_tech%NOTFOUND;
    DBMS_OUTPUT.PUT_LINE(cur_tech%ROWCOUNT || '. ' || l_nom || ' ' || l_sal);
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Lignes lues : ' || cur_tech%ROWCOUNT);
  CLOSE cur_tech;
END;`,
  table: { cols: ["nom", "salaire"], rows: [["Durand", "3900"], ["Leroy", "4800"], ["Petit", "4300"]], caption: "Jeu de résultats figé à l'OPEN (postes DEV et DBA, tri par nom)" },
  steps: [
    { l: [2, 3, 4], n: "<strong>Déclaration</strong> : le curseur n'est qu'une requête nommée. Rien n'est exécuté, aucune ligne n'est lue.", v: { "cur_tech%ISOPEN": "FALSE" } },
    { l: [5, 6], n: "Variables de réception, ancrées sur les colonnes avec <code>%TYPE</code>.", v: { l_nom: "NULL", l_sal: "NULL" } },
    { l: 8, n: "<strong>OPEN</strong> : Oracle exécute la requête et fige l'image des données. Le pointeur est placé <em>avant</em> la première ligne. <code>%NOTFOUND</code> vaut NULL tant qu'aucun FETCH n'a eu lieu.", v: { "cur_tech%ISOPEN": "TRUE", "cur_tech%NOTFOUND": "NULL", "cur_tech%ROWCOUNT": "0" } },
    { l: 10, n: "<strong>FETCH</strong> : lit la ligne suivante, Durand, et avance le pointeur.", v: { l_nom: "Durand", l_sal: "3900", "cur_tech%NOTFOUND": "FALSE", "cur_tech%ROWCOUNT": "1" }, p: 0 },
    { l: 11, n: "<code>%NOTFOUND</code> vaut FALSE : on reste dans la boucle." },
    { l: 12, n: "Affichage, avec le rang de la ligne donné par <code>%ROWCOUNT</code>.", o: "1. Durand 3900" },
    { l: 10, n: "Deuxième FETCH : Leroy.", v: { l_nom: "Leroy", l_sal: "4800", "cur_tech%ROWCOUNT": "2" }, p: 1 },
    { l: [11, 12], n: "Toujours une ligne : on affiche.", o: "2. Leroy 4800" },
    { l: 10, n: "Troisième FETCH : Petit.", v: { l_nom: "Petit", l_sal: "4300", "cur_tech%ROWCOUNT": "3" }, p: 2 },
    { l: [11, 12], n: "On affiche la dernière ligne.", o: "3. Petit 4300" },
    { l: 10, n: "Quatrième FETCH : plus de ligne. <code>%NOTFOUND</code> passe à TRUE, <code>%ROWCOUNT</code> reste à 3, et <strong>les variables gardent leurs anciennes valeurs</strong> (Petit, 4300).", v: { "cur_tech%NOTFOUND": "TRUE" }, p: null },
    { l: 11, n: "<strong>EXIT</strong> : placé juste après le FETCH, il évite de réafficher Petit une seconde fois." },
    { l: 14, n: "Le curseur est encore ouvert : <code>%ROWCOUNT</code> donne le nombre total de lignes lues.", o: "Lignes lues : 3" },
    { l: 15, n: "<strong>CLOSE</strong> : libère la zone de travail. Désormais, lire <code>%NOTFOUND</code> ou <code>%ROWCOUNT</code> lèverait INVALID_CURSOR.", v: { "cur_tech%ISOPEN": "FALSE", "cur_tech%NOTFOUND": "(INVALID_CURSOR)", "cur_tech%ROWCOUNT": "(INVALID_CURSOR)" } }
  ]
};

/* ---- ch05 ---- */
QUIZ.ch05 = [
  { q: "Une exception est levée dans la section <code>DECLARE</code> d'un sous-bloc (initialisation invalide). Qui peut la traiter ?",
    o: ["La section EXCEPTION du même sous-bloc", "La section EXCEPTION du bloc englobant", "Personne : c'est une erreur de compilation", "Elle est ignorée et la variable reste NULL"], a: 1,
    w: "Une erreur levée pendant les déclarations n'est pas vue par le gestionnaire du même bloc : elle remonte directement au bloc englobant." },
  { q: "Quelle plage de codes accepte <code>RAISE_APPLICATION_ERROR</code> ?",
    o: ["-1 à -999", "-20000 à -20999", "20000 à 20999", "N'importe quel code négatif"], a: 1,
    w: "Les codes -20000 à -20999 sont réservés aux erreurs applicatives. Hors de cette plage, on obtient ORA-21000." },
  { q: "Que renvoie <code>SQLCODE</code> dans un gestionnaire <code>WHEN NO_DATA_FOUND</code> ?",
    o: ["-1403", "+100", "0", "+1"], a: 1,
    w: "Exception notable : NO_DATA_FOUND (ORA-01403) donne SQLCODE = +100, valeur héritée de la norme SQL. +1 correspond à une exception utilisateur, 0 à l'absence d'erreur." },
  { q: "Dans un gestionnaire, que fait <code>RAISE;</code> écrit seul ?",
    o: ["Il lève une exception utilisateur anonyme (ORA-06510)", "Il re-lève l'exception courante avec son code et son message d'origine", "Il relance le bloc depuis le début", "Rien : il faut toujours nommer l'exception"], a: 1,
    w: "RAISE sans argument re-lève l'exception en cours de traitement ; il n'est autorisé que dans un gestionnaire d'exception." },
  { q: "Après un <code>UPDATE</code> réussi, un bloc anonyme lancé depuis SQL*Plus échoue avec une exception non traitée. Que devient cet <code>UPDATE</code> ?",
    o: ["Il est validé automatiquement", "Il reste en attente de COMMIT", "Il est annulé, ainsi que toute la transaction depuis le dernier COMMIT", "Il est annulé, mais le travail fait avant l'appel du bloc reste en place"], a: 3,
    w: "Le bloc est un seul appel pour le client : tout ce qu'il a modifié est annulé (Oracle revient au point de sauvegarde implicite posé au début de l'appel). Ce qui précédait l'appel dans la transaction reste en attente de COMMIT ou ROLLBACK." },
  { q: "Pourquoi un <code>WHEN OTHERS</code> doit-il en général se terminer par <code>RAISE</code> ou <code>RAISE_APPLICATION_ERROR</code> ?",
    o: ["Sinon le bloc ne compile pas", "Sinon l'erreur est avalée : l'appelant croit à un succès et des données peuvent être validées à moitié", "Pour que SQLERRM soit renseigné", "Pour libérer les curseurs ouverts"], a: 1,
    w: "WHEN OTHERS THEN NULL masque toutes les erreurs. Le compilateur peut le signaler par l'avertissement PLW-06009, mais le code compile." }
];
STEPPERS["propagation"] = {
  title: "Propagation d'une exception entre blocs imbriqués",
  code: `
DECLARE
  l_nom employes.nom%TYPE;
BEGIN
  DBMS_OUTPUT.PUT_LINE('Début');
  BEGIN
    SELECT nom INTO l_nom
      FROM employes WHERE dept_id = 20;
    DBMS_OUTPUT.PUT_LINE('Nom : ' || l_nom);
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      DBMS_OUTPUT.PUT_LINE('Aucun employé');
  END;
  DBMS_OUTPUT.PUT_LINE('Suite du bloc externe');
EXCEPTION
  WHEN TOO_MANY_ROWS THEN
    DBMS_OUTPUT.PUT_LINE('Externe : ' || SQLERRM);
    RAISE_APPLICATION_ERROR(-20020, 'Plusieurs employés dans le dept 20');
END;`,
  table: {
    cols: ["emp_id", "nom", "dept_id"],
    rows: [["101", "Bernard", "20"], ["102", "Petit", "20"], ["103", "Durand", "20"], ["104", "Leroy", "20"], ["109", "Garcia", "20"]],
    caption: "Employés du département 20 (l'ordre de lecture n'est pas garanti)"
  },
  steps: [
    { l: 2, n: "Déclaration de la variable du bloc externe.", v: { l_nom: "NULL" } },
    { l: 4, n: "Première instruction du bloc externe.", o: "Début" },
    { l: [6, 7], n: "Le sous-bloc commence. Le <code>SELECT INTO</code> lit une première ligne.", p: 0 },
    { l: [6, 7], n: "Pour vérifier qu'il n'y a qu'une ligne, Oracle tente d'en lire une deuxième : elle existe. Exception <code>TOO_MANY_ROWS</code> (ORA-01422). La valeur de <code>l_nom</code> est désormais indéfinie : ne t'y fie pas.", p: 1, v: { exception: "TOO_MANY_ROWS" } },
    { l: [9, 10], n: "La ligne 8 est <strong>sautée</strong>. Oracle cherche un gestionnaire dans le sous-bloc : il n'y a que <code>NO_DATA_FOUND</code>, qui ne correspond pas. La ligne 11 n'est pas exécutée." },
    { l: 12, n: "Aucun gestionnaire adapté : le sous-bloc se termine en erreur et l'exception <strong>remonte</strong> au bloc englobant." },
    { l: 13, n: "La ligne 13 est <strong>sautée</strong> elle aussi : l'exception est toujours active, le bloc externe passe directement à sa section <code>EXCEPTION</code>." },
    { l: 15, n: "<code>WHEN TOO_MANY_ROWS</code> correspond : l'exception est traitée ici.", v: { exception: "TOO_MANY_ROWS (traitée)" } },
    { l: 16, n: "<code>SQLERRM</code> donne le message de l'erreur courante.", o: "Externe : ORA-01422: exact fetch returns more than requested number of rows" },
    { l: 17, n: "<code>RAISE_APPLICATION_ERROR</code> lève une <strong>nouvelle</strong> erreur depuis le gestionnaire. Une exception levée dans un gestionnaire n'est jamais traitée par le même bloc : elle part vers l'appelant.", v: { exception: "ORA-20020" }, o: "!ORA-20020: Plusieurs employés dans le dept 20" },
    { l: 18, n: "Plus aucun bloc englobant : le client reçoit l'erreur, avec la ligne où elle a été levée. Si le bloc avait modifié des données, tout serait annulé (rollback au niveau de l'appel). Attention, dans SQL*Plus l'ordre réel est inversé : le message d'erreur s'affiche d'abord, puis le tampon <code>DBMS_OUTPUT</code> (« Début », « Externe : … »), lu à la fin de l'appel.", o: "!ORA-06512: at line 17" }
  ]
};

/* ---- ch06 ---- */
QUIZ.ch06 = [
  { q: "La variable <code>l_sal</code> vaut 4300. On la passe à un paramètre <code>OUT</code>. Que vaut le paramètre au début du sous-programme ?",
    o: ["4300", "NULL", "0", "Cela dépend du type"], a: 1,
    w: "Un paramètre OUT de type scalaire démarre toujours à NULL. Pour recevoir la valeur de l'appelant, il faut IN OUT." },
  { q: "Une procédure affecte son paramètre <code>OUT</code> (sans NOCOPY) puis lève une exception non traitée. L'appelant attrape l'erreur. Que contient sa variable ?",
    o: ["La valeur affectée par la procédure", "NULL", "Sa valeur d'avant l'appel", "Une valeur indéterminée"], a: 2,
    w: "Sans NOCOPY, OUT et IN OUT travaillent sur une copie, recopiée vers l'appelant seulement en cas de fin normale." },
  { q: "Avec <code>augmenter_salaire(p_emp_id, p_pct DEFAULT 5, p_nouveau OUT)</code>, quel appel ne compile pas ?",
    o: ["<code>augmenter_salaire(102, 10, l_sal)</code>", "<code>augmenter_salaire(p_nouveau =&gt; l_sal, p_emp_id =&gt; 102)</code>",
        "<code>augmenter_salaire(p_emp_id =&gt; 102, 10, l_sal)</code>", "<code>augmenter_salaire(102, p_nouveau =&gt; l_sal)</code>"], a: 2,
    w: "Un paramètre positionnel ne peut pas suivre un paramètre nommé (PLS-00312). En notation nommée, l'ordre est libre et p_pct peut être omis." },
  { q: "Une fonction fait un <code>INSERT INTO journal_erreurs</code> et elle est appelée dans un <code>SELECT</code>. Que se passe-t-il ?",
    o: ["L'insertion est faite et validée avec la requête", "ORA-14551: cannot perform a DML operation inside a query",
        "ORA-04091: table is mutating", "PLS-00231 à la compilation"], a: 1,
    w: "Une fonction appelée depuis une requête ne peut pas faire de DML (ORA-14551), ni de COMMIT, ROLLBACK ou DDL (ORA-14552, aussi levée depuis un ordre DML), sauf si elle est déclarée en transaction autonome." },
  { q: "Quelle option met en commun les résultats d'une fonction entre toutes les sessions ?",
    o: ["DETERMINISTIC", "PRAGMA UDF", "RESULT_CACHE", "NOCOPY"], a: 2,
    w: "RESULT_CACHE stocke les résultats dans la SGA et les invalide quand une table lue est modifiée. DETERMINISTIC n'est qu'une promesse exploitée pendant l'exécution d'une requête." },
  { q: "Le propriétaire d'une procédure <code>AUTHID DEFINER</code> a le droit <code>SELECT</code> sur une table via un rôle seulement, et la lit en SQL statique. Résultat ?",
    o: ["Tout fonctionne", "La procédure ne compile pas : ORA-00942", "Elle compile mais échoue à l'exécution", "Seul le propriétaire peut l'exécuter"], a: 1,
    w: "Les privilèges obtenus via un rôle ne comptent pas pour compiler du PL/SQL stocké : il faut un GRANT direct au propriétaire." }
];

STEPPERS["ch06-out-exception"] = {
  title: "Paramètre OUT et exception",
  code: `
DECLARE
  l_sal NUMBER;
  PROCEDURE augmenter (p_emp_id IN NUMBER, p_nouveau OUT NUMBER) IS
  BEGIN
    p_nouveau := 0;                                  -- valeur provisoire
    UPDATE employes SET salaire = salaire * 1.1 WHERE emp_id = p_emp_id;
    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20001, 'Employé ' || p_emp_id || ' introuvable');
    END IF;
    SELECT salaire INTO p_nouveau FROM employes WHERE emp_id = p_emp_id;
  END augmenter;
BEGIN
  augmenter(102, l_sal);
  DBMS_OUTPUT.PUT_LINE('Après 102 : ' || l_sal);
  augmenter(999, l_sal);
  DBMS_OUTPUT.PUT_LINE('Après 999 : ' || l_sal);
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE(SQLERRM);
    DBMS_OUTPUT.PUT_LINE('l_sal = ' || l_sal);
    ROLLBACK;
END;`,
  table: { cols: ["emp_id", "nom", "salaire"], rows: [["102", "Petit", "4300"]], caption: "Salaire de départ de Petit" },
  steps: [
    { l: 2, n: "Déclaration : <code>l_sal</code> vaut NULL.", v: { l_sal: "NULL" } },
    { l: 13, n: "Premier appel avec 102. Le paramètre <code>p_nouveau</code> est une copie locale qui démarre à NULL.", v: { p_emp_id: "102", p_nouveau: "NULL" } },
    { l: 5, n: "Affectation locale : seule la copie change, pas <code>l_sal</code>.", v: { p_nouveau: "0" } },
    { l: 6, n: "La mise à jour touche une ligne : 4300 × 1,1 = 4730.", p: 0 },
    { l: [7, 9], n: "<code>SQL%ROWCOUNT</code> = 1 : pas d'erreur." },
    { l: 10, n: "Relecture du nouveau salaire dans la copie locale.", v: { p_nouveau: "4730" } },
    { l: 11, n: "Fin <strong>normale</strong> : la copie est recopiée dans <code>l_sal</code>.", v: { l_sal: "4730", p_emp_id: "-", p_nouveau: "-" } },
    { l: 14, n: "Affichage.", o: "Après 102 : 4730" },
    { l: 15, n: "Second appel avec 999. Nouvelle copie locale, qui démarre à NULL.", v: { p_emp_id: "999", p_nouveau: "NULL" } },
    { l: 5, n: "Affectation de la valeur provisoire, toujours dans la copie.", v: { p_nouveau: "0" } },
    { l: 6, n: "Aucune ligne ne correspond à 999." },
    { l: [7, 8], n: "<code>SQL%ROWCOUNT</code> = 0 : ORA-20001 est levée et n'est pas traitée dans la procédure." },
    { l: 11, n: "Sortie par exception : la copie locale est <strong>abandonnée</strong>, <code>l_sal</code> n'est pas modifiée.", v: { p_emp_id: "-", p_nouveau: "-" } },
    { l: [17, 18], n: "L'exception remonte au bloc appelant : la ligne 16 n'est jamais exécutée, on saute au gestionnaire." },
    { l: 19, n: "Message de l'erreur.", o: "ORA-20001: Employé 999 introuvable" },
    { l: 20, n: "<code>l_sal</code> vaut toujours 4730, pas 0 : la valeur provisoire n'a jamais quitté la procédure.", o: "l_sal = 4730" },
    { l: 21, n: "Le gestionnaire annule l'augmentation de Petit." }
  ]
};

/* ---- ch07 ---- */
QUIZ.ch07 = [
  { q: "Tu recompiles uniquement le <strong>corps</strong> de <code>pkg_rh</code> (spécification inchangée). Que deviennent les procédures qui appellent <code>pkg_rh.augmenter</code> ?",
    o: ["Elles passent à INVALID et seront recompilées au prochain appel", "Elles restent VALID : elles dépendent de la spécification", "Elles sont supprimées", "Elles restent VALID seulement si elles sont dans le même schéma"], a: 1,
    w: "Les appelants dépendent de la spécification. Modifier le corps seul ne les invalide pas : c'est ce qui évite les cascades de recompilation." },
  { q: "Où place-t-on une procédure qui doit rester <strong>privée</strong> au package ?",
    o: ["Dans la spécification, avec le mot-clé PRIVATE", "Dans le corps uniquement, sans la déclarer dans la spécification", "Dans la spécification et le corps", "Dans un package séparé"], a: 1,
    w: "Tout ce qui est déclaré dans la spécification est public. Ce qui n'existe que dans le corps est privé. Il n'y a pas de mot-clé PRIVATE en PL/SQL." },
  { q: "Quand s'exécute la section d'initialisation (le <code>BEGIN … END</code> final du corps) ?",
    o: ["À chaque appel d'un sous-programme du package", "À la compilation du corps", "Une fois par session, à la première référence au package", "Une fois pour toute l'instance, au démarrage de la base"], a: 2,
    w: "Elle s'exécute à l'instanciation du package dans la session, c'est-à-dire au premier appel ou à la première lecture d'une variable du package. Une autre session la réexécute pour elle-même." },
  { q: "Une procédure de package fait <code>g_compteur := g_compteur + 1</code> puis la session exécute <code>ROLLBACK</code>. Que vaut <code>g_compteur</code> ?",
    o: ["Sa valeur d'avant l'appel", "La valeur incrémentée : une variable de package n'est pas transactionnelle", "NULL", "0, car le ROLLBACK réinitialise le package"], a: 1,
    w: "ROLLBACK n'annule que les modifications de données. L'état du package vit en mémoire de session (UGA) et ignore les transactions." },
  { q: "Après le déploiement d'une nouvelle version d'un corps de package qui contient une variable globale, une session déjà ouverte reçoit <code>ORA-04068</code>. Que se passe-t-il si elle rappelle immédiatement la même procédure ?",
    o: ["Même erreur, il faut redémarrer la base", "Même erreur jusqu'à la déconnexion de la session", "L'appel fonctionne : l'état a été réinitialisé, la variable repart de sa valeur initiale", "L'appel fonctionne avec l'ancienne valeur de la variable"], a: 2,
    w: "Le premier appel signale que l'état a été jeté. Le suivant réinstancie le package (initialisation comprise) et fonctionne, mais les valeurs des variables sont perdues." },
  { q: "Quelle paire de déclarations est une surcharge <strong>utilisable</strong> ?",
    o: ["<code>p(x IN NUMBER)</code> et <code>p(x OUT NUMBER)</code>", "<code>p(x IN NUMBER)</code> et <code>p(x IN INTEGER)</code>", "<code>f(x NUMBER) RETURN NUMBER</code> et <code>f(x NUMBER) RETURN VARCHAR2</code>", "<code>p(x IN NUMBER)</code> et <code>p(x IN DATE)</code>"], a: 3,
    w: "NUMBER et DATE sont de familles différentes : Oracle sait choisir. Un mode différent, un sous-type de la même famille (INTEGER est un sous-type de NUMBER) ou un type de retour différent rendent l'appel ambigu (PLS-00307)." }
];
STEPPERS["pkg-etat"] = {
  title: "L'état de pkg_rh dans une session",
  code: `
-- Corps de pkg_rh (extrait)
CREATE OR REPLACE PACKAGE BODY pkg_rh AS
  g_nb_appels PLS_INTEGER := 0;
  PROCEDURE augmenter (p_emp_id IN employes.emp_id%TYPE, p_pct IN NUMBER) IS
  BEGIN
    g_nb_appels := g_nb_appels + 1;
    UPDATE employes SET salaire = salaire * (1 + p_pct / 100) WHERE emp_id = p_emp_id;
  END augmenter;
  -- ... embaucher, nb_appels (RETURN g_nb_appels), etc.
BEGIN
  DBMS_OUTPUT.PUT_LINE('pkg_rh initialisé');
END pkg_rh;
/
-- Session de Léo (SET SERVEROUTPUT ON)
BEGIN
  pkg_rh.augmenter(103, 10);
  DBMS_OUTPUT.PUT_LINE('Appels : ' || pkg_rh.nb_appels);
END;
/
ROLLBACK;
BEGIN
  pkg_rh.augmenter(103, 10);
  DBMS_OUTPUT.PUT_LINE('Appels : ' || pkg_rh.nb_appels);
END;
/`,
  steps: [
    { l: 16, n: "Léo vient de se connecter. Première référence à <code>pkg_rh</code> dans sa session : le code compilé est chargé en mémoire partagée s'il n'y est pas déjà, mais sa session n'a encore <strong>aucun état</strong> pour ce package.",
      v: { "état pkg_rh": "non instancié", "salaire de 103": "3900" } },
    { l: 3, n: "Oracle instancie le package pour cette session : il réserve ses variables (en UGA) et exécute leurs initialisations.",
      v: { "état pkg_rh": "instancié", g_nb_appels: "0" } },
    { l: [10, 11, 12], n: "Puis il exécute la section d'initialisation, <strong>une seule fois</strong> pour toute la session. La ligne part dans le tampon DBMS_OUTPUT, que SQL*Plus affiche à la fin du bloc.",
      o: "pkg_rh initialisé" },
    { l: [4, 6], n: "L'appel proprement dit : <code>augmenter(103, 10)</code> incrémente le compteur.", v: { g_nb_appels: "1" } },
    { l: 7, n: "L'UPDATE modifie Durand : 3900 × 1,10. La transaction n'est pas validée.", v: { "salaire de 103": "4290 (non validé)" } },
    { l: 17, n: "<code>nb_appels</code> lit la variable du package.", o: "Appels : 1" },
    { l: 20, n: "<code>ROLLBACK</code> annule l'UPDATE. En revanche, <code>g_nb_appels</code> n'est pas une donnée de table : elle <strong>garde la valeur 1</strong>.",
      v: { "salaire de 103": "3900", g_nb_appels: "1 (inchangé)" } },
    { l: 22, n: "Deuxième bloc, même session : le package est déjà instancié. Pas de réinitialisation de la variable, pas de section d'initialisation, rien n'est affiché." },
    { l: 6, n: "Le compteur continue depuis sa valeur précédente.", v: { g_nb_appels: "2" } },
    { l: 7, n: "Nouvel UPDATE sur la valeur annulée : 3900 × 1,10.", v: { "salaire de 103": "4290 (non validé)" } },
    { l: 23, n: "Le compteur affiche 2 alors qu'une seule augmentation est réellement en cours : la variable a survécu au ROLLBACK.", o: "Appels : 2" },
    { l: [2, 3], n: "Cet état disparaît seulement à la fin de la session, avec <code>DBMS_SESSION.RESET_PACKAGE</code>, ou si le package est recompilé (le prochain appel lève alors ORA-04068). Une autre session aurait eu sa propre copie, à 0." }
  ]
};

/* ---- ch08 ---- */
QUIZ.ch08 = [
  { q: "Quel type de collection peut-on utiliser <strong>sans</strong> l'initialiser par un constructeur ?",
    o: ["La table imbriquée", "Le VARRAY", "Le tableau associatif (INDEX BY)", "Aucun : les trois exigent un constructeur"], a: 2,
    w: "Un tableau associatif est vide et utilisable dès sa déclaration. Une table imbriquée ou un VARRAY déclaré sans valeur est NULL atomique : il faut appeler le constructeur avant EXTEND ou une affectation." },
  { q: "<code>l t_noms;</code> (table imbriquée non initialisée), puis <code>l.EXTEND;</code>. Que se passe-t-il ?",
    o: ["ORA-06531 : Reference to uninitialized collection", "ORA-06533 : Subscript beyond count",
        "NO_DATA_FOUND", "Rien : EXTEND initialise la collection"], a: 0,
    w: "Toute méthode appelée sur une collection NULL lève COLLECTION_IS_NULL (ORA-06531), sauf EXISTS qui renvoie FALSE." },
  { q: "<code>l := t_noms('A', 'B');</code> puis <code>l(3) := 'C';</code> sans EXTEND. Quelle erreur ?",
    o: ["ORA-06531 : Reference to uninitialized collection", "ORA-06532 : Subscript outside of limit",
        "ORA-06533 : Subscript beyond count", "Aucune : la collection s'agrandit toute seule"], a: 2,
    w: "L'indice 3 dépasse le nombre de cases allouées (2) : SUBSCRIPT_BEYOND_COUNT. ORA-06532 concerne un indice hors des bornes légales (0, négatif, ou au-delà de la limite d'un VARRAY)." },
  { q: "Une table imbriquée contient les indices 1, 2, 3. Après <code>l.DELETE(2)</code>, que valent <code>l.COUNT</code> et <code>l.LAST</code> ?",
    o: ["COUNT = 2, LAST = 2", "COUNT = 2, LAST = 3", "COUNT = 3, LAST = 3", "COUNT = 3, LAST = 2"], a: 1,
    w: "COUNT compte les éléments existants (2) ; LAST est le plus grand indice existant (3). La collection est devenue creuse." },
  { q: "Dans un tableau associatif <code>INDEX BY PLS_INTEGER</code> vide, que fait <code>x := l(5);</code> ?",
    o: ["x reçoit NULL", "Lève NO_DATA_FOUND", "Lève ORA-06533", "Lève ORA-06531"], a: 1,
    w: "Lire une clé absente d'un tableau associatif (ou un élément supprimé d'une table imbriquée) lève NO_DATA_FOUND. Teste avec EXISTS avant de lire." },
  { q: "Que renvoie <code>t_liste_id(1, 2, 2) MULTISET UNION t_liste_id(2, 3)</code> ?",
    o: ["(1, 2, 3)", "(1, 2, 2, 2, 3)", "(1, 2, 2, 3)", "(2)"], a: 1,
    w: "Sans DISTINCT, MULTISET UNION concatène les deux collections et garde tous les doublons (comme UNION ALL). Il faut MULTISET UNION DISTINCT, ou SET(), pour les éliminer." }
];

STEPPERS["nt-creuse"] = {
  title: "Une table imbriquée devient creuse",
  code: `
DECLARE
  TYPE t_noms IS TABLE OF VARCHAR2(30);
  l_noms t_noms := t_noms('Petit', 'Durand');
  i      PLS_INTEGER;
BEGIN
  l_noms.EXTEND;
  l_noms(3) := 'Leroy';
  l_noms.DELETE(2);
  DBMS_OUTPUT.PUT_LINE('COUNT=' || l_noms.COUNT || ' LAST=' || l_noms.LAST);
  DBMS_OUTPUT.PUT_LINE('NEXT(1)=' || l_noms.NEXT(1));
  i := l_noms.FIRST;
  WHILE i IS NOT NULL LOOP
    DBMS_OUTPUT.PUT_LINE(i || ' ' || l_noms(i));
    i := l_noms.NEXT(i);
  END LOOP;
END;`,
  steps: [
    { l: 2, n: "Déclaration du <strong>type</strong> table imbriquée. Aucune variable n'existe encore." },
    { l: 3, n: "Le <strong>constructeur</strong> crée la collection avec deux éléments, aux indices 1 et 2. Sans lui, <code>l_noms</code> serait NULL atomique et tout <code>EXTEND</code> lèverait ORA-06531.",
      v: { contenu: "[1:Petit, 2:Durand]", COUNT: "2", FIRST: "1", LAST: "2" } },
    { l: 4, n: "<code>i</code> servira d'indice de parcours.", v: { i: "NULL" } },
    { l: 6, n: "<code>EXTEND</code> ajoute une case à la fin, qui vaut NULL. Elle <em>existe</em> : <code>COUNT</code> passe à 3.",
      v: { contenu: "[1:Petit, 2:Durand, 3:NULL]", COUNT: "3", LAST: "3" } },
    { l: 7, n: "Affectation de la case 3. Sans l'<code>EXTEND</code> précédent, cette ligne lèverait ORA-06533 (Subscript beyond count).",
      v: { contenu: "[1:Petit, 2:Durand, 3:Leroy]" } },
    { l: 8, n: "<code>DELETE(2)</code> supprime l'élément 2 sans décaler les autres : la table devient <strong>creuse</strong>. L'indice 2 n'existe plus.",
      v: { contenu: "[1:Petit, 3:Leroy]", COUNT: "2" } },
    { l: 9, n: "<code>COUNT</code> compte les éléments présents (2), <code>LAST</code> donne le plus grand indice (3). Ils ne sont plus égaux.",
      o: "COUNT=2 LAST=3" },
    { l: 10, n: "<code>NEXT(1)</code> saute l'indice supprimé et renvoie le suivant <em>existant</em> : 3.",
      o: "NEXT(1)=3" },
    { l: 11, n: "Début du parcours sûr : on part de <code>FIRST</code>.", v: { i: "1" } },
    { l: [12, 13], n: "<code>i</code> n'est pas NULL : on affiche l'élément 1.", o: "1 Petit" },
    { l: 14, n: "<code>NEXT(1)</code> = 3 : l'indice 2 est sauté. Une boucle <code>FOR i IN 1 .. COUNT</code> aurait lu l(2) et levé NO_DATA_FOUND.",
      v: { i: "3" } },
    { l: [12, 13], n: "Affichage de l'élément 3.", o: "3 Leroy" },
    { l: 14, n: "<code>NEXT(3)</code> renvoie NULL : il n'y a plus d'élément après 3.", v: { i: "NULL" } },
    { l: [12, 15], n: "La condition <code>i IS NOT NULL</code> est fausse : fin de la boucle." },
    { l: 16, n: "Fin du bloc : les deux éléments restants ont été lus, sans erreur." }
  ]
};

/* ---- ch09 ---- */
QUIZ.ch09 = [
  { q: "Pourquoi une boucle <code>FOR</code> qui exécute un <code>UPDATE</code> par ligne est-elle lente sur 100 000 lignes ?",
    o: ["Parce que chaque UPDATE fait un COMMIT implicite", "Parce que chaque UPDATE provoque un changement de contexte entre les moteurs PL/SQL et SQL",
        "Parce que la boucle FOR lit les lignes une par une sans aucune optimisation", "Parce qu'Oracle verrouille toute la table à chaque tour"], a: 1,
    w: "Chaque ordre SQL lancé depuis PL/SQL est un aller-retour entre les deux moteurs. FORALL envoie tout le lot en un seul appel. La lecture de la boucle FOR, elle, est déjà faite par paquets de 100 depuis 10g." },
  { q: "Un curseur renvoie 5 lignes. On fait <code>FETCH cur_emps BULK COLLECT INTO l_t LIMIT 2;</code> suivi immédiatement de <code>EXIT WHEN cur_emps%NOTFOUND;</code>, puis on traite le lot. Combien de lignes sont traitées ?",
    o: ["5", "4", "2", "0"], a: 1,
    w: "Le troisième FETCH ne ramène qu'une ligne (moins que LIMIT) : cur_emps%NOTFOUND est déjà TRUE et on sort sans traiter la 5e ligne. D'où EXIT WHEN l_t.COUNT = 0." },
  { q: "Que peut contenir un <code>FORALL</code> ?",
    o: ["Un bloc BEGIN … END avec plusieurs ordres", "Un seul ordre INSERT, UPDATE, DELETE ou MERGE",
        "Un ordre DML et un IF pour filtrer les lignes", "N'importe quelle instruction PL/SQL, répétée pour chaque indice"], a: 1,
    w: "FORALL n'est pas une boucle : c'est un seul ordre DML exécuté avec un tableau de valeurs liées. Le filtrage se fait avant, dans la collection (INDICES OF, VALUES OF)." },
  { q: "Après <code>FORALL … SAVE EXCEPTIONS</code>, une ligne viole une contrainte CHECK (ORA-02290). Quelle exception est levée à la fin et que vaut <code>SQL%BULK_EXCEPTIONS(1).ERROR_CODE</code> ?",
    o: ["ORA-02290, et ERROR_CODE = -2290", "ORA-24381, et ERROR_CODE = -2290", "ORA-24381, et ERROR_CODE = 2290", "Aucune exception, et ERROR_CODE = 2290"], a: 2,
    w: "SAVE EXCEPTIONS lève ORA-24381 (error(s) in array DML) une fois toutes les itérations tentées. ERROR_CODE est positif : on écrit SQLERRM(-ERROR_CODE)." },
  { q: "La collection <code>l_ids</code> a les indices 1, 2 et 4 (l'élément 3 a été supprimé). Quelle écriture fonctionne ?",
    o: ["FORALL i IN 1 .. l_ids.COUNT", "FORALL i IN l_ids.FIRST .. l_ids.LAST", "FORALL i IN INDICES OF l_ids", "FORALL i IN VALUES OF l_ids"], a: 2,
    w: "Les deux premières visitent l'indice 3 qui n'existe pas (ORA-22160). INDICES OF parcourt les indices existants. VALUES OF utiliserait les valeurs de l_ids (des emp_id) comme indices d'une autre collection." },
  { q: "Que fait <code>PIPE ROW</code> dans une fonction <code>PIPELINED</code> ?",
    o: ["Il ajoute la ligne à une collection renvoyée en une fois par RETURN", "Il envoie la ligne immédiatement à la requête appelante",
        "Il écrit la ligne dans une table temporaire", "Il termine la fonction en renvoyant cette ligne"], a: 1,
    w: "La ligne part tout de suite vers le SELECT … FROM TABLE(f()) : pas de collection complète en mémoire. La fonction se termine par RETURN sans valeur." }
];

STEPPERS["ch09-limit"] = {
  title: "BULK COLLECT … LIMIT 2 sur 5 lignes",
  code: `
DECLARE
  CURSOR cur_emps IS SELECT nom FROM employes
                      WHERE date_embauche < DATE '2020-01-01' ORDER BY emp_id;
  TYPE t_noms IS TABLE OF employes.nom%TYPE;
  l_noms t_noms;
BEGIN
  OPEN cur_emps;
  LOOP
    FETCH cur_emps BULK COLLECT INTO l_noms LIMIT 2;
    EXIT WHEN l_noms.COUNT = 0;
    DBMS_OUTPUT.PUT_LINE(l_noms.COUNT || ' ligne(s), %NOTFOUND = '
      || CASE WHEN cur_emps%NOTFOUND THEN 'TRUE' ELSE 'FALSE' END);
  END LOOP;
  CLOSE cur_emps;
END;`,
  table: {
    cols: ["emp_id", "nom", "date_embauche"],
    rows: [["100", "Martin", "2015-03-01"], ["101", "Bernard", "2016-06-15"], ["102", "Petit", "2019-09-02"],
           ["104", "Leroy", "2018-04-23"], ["105", "Moreau", "2017-02-01"]],
    caption: "Jeu de résultats du curseur : 5 lignes. La ligne surlignée est la dernière lue."
  },
  steps: [
    { l: [2, 3], n: "Le curseur sélectionne les employés embauchés avant 2020 : 5 lignes. La collection n'est pas initialisée : <code>BULK COLLECT</code> s'en chargera.",
      v: { "l_noms": "NULL (non initialisée)" } },
    { l: 7, n: "<code>OPEN</code> exécute la requête. Avant le premier <code>FETCH</code>, <code>cur_emps%NOTFOUND</code> vaut NULL.",
      v: { "cur_emps%ROWCOUNT": "0", "cur_emps%NOTFOUND": "NULL" } },
    { l: 9, n: "Lot 1 : le <code>FETCH</code> ramène 2 lignes, autant que <code>LIMIT</code>. Le curseur n'a pas encore vu la fin du jeu.",
      v: { "l_noms": "(Martin, Bernard)", "l_noms.COUNT": "2", "cur_emps%ROWCOUNT": "2", "cur_emps%NOTFOUND": "FALSE" }, p: 1 },
    { l: 10, n: "<code>COUNT = 2</code> : on ne sort pas." },
    { l: [11, 12], n: "On traite le lot (ici, on affiche).", o: "2 ligne(s), %NOTFOUND = FALSE" },
    { l: 9, n: "Lot 2 : la collection est <strong>vidée puis remplie</strong> avec les 2 lignes suivantes. Les lots ne s'accumulent pas. <code>cur_emps%ROWCOUNT</code>, lui, est cumulatif.",
      v: { "l_noms": "(Petit, Leroy)", "l_noms.COUNT": "2", "cur_emps%ROWCOUNT": "4", "cur_emps%NOTFOUND": "FALSE" }, p: 3 },
    { l: [10, 11, 12], n: "<code>COUNT = 2</code> : on traite le lot.", o: "2 ligne(s), %NOTFOUND = FALSE" },
    { l: 9, n: "Lot 3 : il ne reste qu'une ligne. Le <code>FETCH</code> en ramène 1, <strong>moins que LIMIT</strong> : le curseur a atteint la fin, <code>cur_emps%NOTFOUND</code> devient TRUE dès maintenant.",
      v: { "l_noms": "(Moreau)", "l_noms.COUNT": "1", "cur_emps%ROWCOUNT": "5", "cur_emps%NOTFOUND": "TRUE" }, p: 4 },
    { l: 10, n: "Le moment clé : <code>COUNT = 1</code>, on reste dans la boucle. Avec <code>EXIT WHEN cur_emps%NOTFOUND</code> à cet endroit, on sortirait ici et <strong>Moreau ne serait jamais traité</strong>." },
    { l: [11, 12], n: "Le dernier lot, incomplet, est bien traité.", o: "1 ligne(s), %NOTFOUND = TRUE" },
    { l: 9, n: "Lot 4 : plus rien à lire. Le <code>FETCH</code> ne lève pas d'erreur, il renvoie une collection vide.",
      v: { "l_noms": "() vide", "l_noms.COUNT": "0", "cur_emps%ROWCOUNT": "5", "cur_emps%NOTFOUND": "TRUE" }, p: -1 },
    { l: 10, n: "<code>COUNT = 0</code> : c'est le seul test qui dit « plus aucune ligne à traiter ». On sort de la boucle." },
    { l: 14, n: "Fermeture du curseur. Bilan : 4 <code>FETCH</code>, 3 lots traités (2, 2, 1), aucune ligne perdue." }
  ]
};

/* ---- ch10 ---- */
QUIZ.ch10 = [
  { q: "Un <code>UPDATE</code> modifie 2 lignes. La table a un trigger de chaque type (BEFORE/AFTER, STATEMENT/ROW). Dans quel ordre s'exécutent-ils ?",
    o: ["BS, AS, puis BR et AR pour chaque ligne",
        "BS, puis BR + AR pour la ligne 1, puis BR + AR pour la ligne 2, puis AS",
        "BS, BR ligne 1, BR ligne 2, AR ligne 1, AR ligne 2, AS",
        "BR et AR pour chaque ligne, puis BS et AS"], a: 1,
    w: "BEFORE STATEMENT une fois, puis pour chaque ligne : BEFORE ROW, écriture de la ligne, AFTER ROW. Enfin AFTER STATEMENT une fois." },
  { q: "Dans quel type de trigger peut-on écrire <code>:NEW.nom := UPPER(:NEW.nom);</code> ?",
    o: ["BEFORE … FOR EACH ROW uniquement", "AFTER … FOR EACH ROW uniquement", "Tout trigger de ligne", "Tout trigger, ligne ou instruction"], a: 0,
    w: "La ligne n'est pas encore écrite en BEFORE ROW : on peut changer :NEW. En AFTER ROW, c'est trop tard (ORA-04084 à la compilation). Un trigger d'instruction n'a pas du tout accès à :NEW." },
  { q: "Un trigger <code>BEFORE UPDATE … FOR EACH ROW</code> sur <code>employes</code> fait <code>SELECT AVG(salaire) FROM employes</code>. Que se passe-t-il à l'exécution d'un <code>UPDATE employes</code> ?",
    o: ["Il lit les anciennes valeurs, sans erreur", "Il lit les valeurs déjà modifiées, sans erreur", "ORA-04091 : la table est en mutation", "Le trigger ne compile pas"], a: 2,
    w: "Le trigger compile, mais à l'exécution un trigger de ligne ne peut pas interroger la table en cours de modification : ORA-04091 (table mutante)." },
  { q: "Un trigger AFTER INSERT contient un <code>COMMIT</code>. Que se passe-t-il à la première insertion ?",
    o: ["La ligne est validée immédiatement", "Le COMMIT est ignoré", "ORA-04092 : impossible de valider dans un trigger", "Le trigger est désactivé automatiquement"], a: 2,
    w: "Un trigger fait partie de la transaction de l'ordre déclencheur : COMMIT et ROLLBACK y sont interdits (ORA-04092), sauf dans un trigger déclaré en transaction autonome." },
  { q: "Quelle clause <code>WHEN</code> est correcte dans un trigger de ligne ?",
    o: ["<code>WHEN (:NEW.salaire > 5000)</code>", "<code>WHEN (NEW.salaire > 5000)</code>", "<code>WHEN NEW.salaire > 5000</code>", "<code>WHEN :NEW.salaire > 5000 THEN</code>"], a: 1,
    w: "Dans la clause WHEN, NEW et OLD s'écrivent sans deux-points et la condition est entre parenthèses. Dans le corps du trigger, on écrit :NEW et :OLD." },
  { q: "Un trigger <code>BEFORE UPDATE ON employes</code> (sans FOR EACH ROW) affiche un message. On lance <code>UPDATE employes SET salaire = 0 WHERE dept_id = 40;</code> (département vide). Combien de messages ?",
    o: ["0, aucune ligne n'est touchée", "1", "Autant que d'employés dans la table", "Une erreur ORA-01403"], a: 1,
    w: "Un trigger d'instruction se déclenche une fois par ordre DML, même si l'ordre ne touche aucune ligne. Les triggers de ligne, eux, ne se déclencheraient pas." }
];

STEPPERS["trigger-order"] = {
  title: "Ordre de déclenchement sur un UPDATE de 2 lignes",
  code: `
CREATE OR REPLACE TRIGGER t_bs BEFORE UPDATE ON employes
BEGIN
  DBMS_OUTPUT.PUT_LINE('BEFORE STATEMENT');
END;
/
CREATE OR REPLACE TRIGGER t_br BEFORE UPDATE ON employes FOR EACH ROW
BEGIN
  DBMS_OUTPUT.PUT_LINE('BEFORE ROW ' || :OLD.emp_id || ' : ' || :OLD.salaire || ' -> ' || :NEW.salaire);
END;
/
CREATE OR REPLACE TRIGGER t_ar AFTER UPDATE ON employes FOR EACH ROW
BEGIN
  DBMS_OUTPUT.PUT_LINE('AFTER ROW ' || :NEW.emp_id);
END;
/
CREATE OR REPLACE TRIGGER t_as AFTER UPDATE ON employes
BEGIN
  DBMS_OUTPUT.PUT_LINE('AFTER STATEMENT');
END;
/
UPDATE employes SET salaire = salaire + 100 WHERE emp_id IN (102, 103);`,
  table: { cols: ["emp_id", "nom", "salaire"], rows: [["102", "Petit", "4300"], ["103", "Durand", "3900"]], caption: "Lignes visées par l'UPDATE (état initial)" },
  steps: [
    { l: 21, n: "L'ordre <code>UPDATE</code> démarre. Oracle sait déjà quels triggers existent sur <code>employes</code> pour l'événement UPDATE : les quatre vont intervenir." },
    { l: [1, 3], n: "<b>BEFORE STATEMENT</b> : une seule fois, avant toute ligne. Pas de <code>:OLD</code> ni de <code>:NEW</code> ici : on ne sait pas encore quelles lignes seront touchées.", o: "BEFORE STATEMENT" },
    { l: 21, n: "Première ligne trouvée (l'ordre de parcours des lignes n'est pas garanti ; ici 102). Oracle calcule <code>salaire + 100</code> : <code>:OLD</code> contient la valeur en base, <code>:NEW</code> la valeur proposée.", p: 0,
      v: { "emp_id": "102", ":OLD.salaire": "4300", ":NEW.salaire": "4400" } },
    { l: [6, 8], n: "<b>BEFORE ROW</b> pour 102. C'est le seul endroit où l'on pourrait encore modifier <code>:NEW.salaire</code>.", p: 0, o: "BEFORE ROW 102 : 4300 -> 4400" },
    { l: 21, n: "Oracle écrit la ligne 102 (salaire 4400) et vérifie ses contraintes, par exemple <code>ck_emp_salaire</code>.", p: 0 },
    { l: [11, 13], n: "<b>AFTER ROW</b> pour 102. La ligne est écrite : <code>:NEW</code> est en lecture seule. Idéal pour l'audit.", p: 0, o: "AFTER ROW 102" },
    { l: 21, n: "Ligne suivante : 103. Nouvelles valeurs de <code>:OLD</code> et <code>:NEW</code>.", p: 1,
      v: { "emp_id": "103", ":OLD.salaire": "3900", ":NEW.salaire": "4000" } },
    { l: [6, 8], n: "<b>BEFORE ROW</b> pour 103.", p: 1, o: "BEFORE ROW 103 : 3900 -> 4000" },
    { l: 21, n: "Écriture de la ligne 103 (salaire 4000) et contrôle des contraintes.", p: 1 },
    { l: [11, 13], n: "<b>AFTER ROW</b> pour 103.", p: 1, o: "AFTER ROW 103" },
    { l: [16, 18], n: "<b>AFTER STATEMENT</b> : une seule fois, après toutes les lignes. Plus de <code>:OLD</code> / <code>:NEW</code>, mais la table peut de nouveau être lue sans ORA-04091.",
      v: { "emp_id": "(inaccessible)", ":OLD.salaire": "(inaccessible)", ":NEW.salaire": "(inaccessible)" }, o: "AFTER STATEMENT" },
    { l: 21, n: "Fin de l'ordre : 2 lignes modifiées. Ton outil affiche le contenu du tampon DBMS_OUTPUT (avec <code>SET SERVEROUTPUT ON</code>) et le nombre de lignes mises à jour. Pense à <code>ROLLBACK</code> et à supprimer ces quatre triggers de démonstration." }
  ]
};

/* ---- ch11 ---- */
QUIZ.ch11 = [
  { q: "Session unique : <code>INSERT INTO departements VALUES (50, 'Achats', 'Rennes');</code> puis <code>CREATE TABLE t (id NUMBER);</code> puis <code>ROLLBACK;</code>. Que devient le département 50 ?",
    o: ["Il est annulé par le ROLLBACK", "Il est validé : le CREATE TABLE a fait un COMMIT implicite", "Le CREATE TABLE échoue car une transaction est en cours", "Il reste en attente de COMMIT"], a: 1,
    w: "Tout ordre DDL valide la transaction en cours avant de s'exécuter. Le ROLLBACK qui suit n'a plus rien à annuler." },
  { q: "Que fait <code>ROLLBACK TO SAVEPOINT sp1</code> ?",
    o: ["Il annule toute la transaction et la termine", "Il annule le travail fait après sp1, efface les savepoints posés après sp1 et la transaction continue", "Il valide le travail fait avant sp1", "Il annule le travail fait avant sp1"], a: 1,
    w: "Le travail antérieur à sp1 reste en attente, sp1 lui-même reste utilisable, et il faut toujours un COMMIT ou un ROLLBACK pour terminer la transaction." },
  { q: "Une procédure <code>PRAGMA AUTONOMOUS_TRANSACTION</code> fait un INSERT puis se termine sans COMMIT ni ROLLBACK. Résultat ?",
    o: ["L'INSERT est validé avec la transaction de l'appelant", "L'INSERT est validé automatiquement à la sortie", "ORA-06519 : la transaction autonome active est annulée et l'erreur est levée", "Rien : l'INSERT reste en attente dans la session"], a: 2,
    w: "Une transaction autonome doit être terminée explicitement avant la sortie du sous-programme, sinon ORA-06519: active autonomous transaction detected and rolled back." },
  { q: "Une procédure utilitaire <code>maj_adresse</code> est appelée par plusieurs traitements. Où placer le COMMIT ?",
    o: ["À la fin de maj_adresse, pour être sûr que c'est enregistré", "Dans un trigger AFTER sur la table", "Chez l'appelant de plus haut niveau, qui connaît le périmètre de l'unité de travail", "Après chaque UPDATE de maj_adresse"], a: 2,
    w: "Un COMMIT dans la procédure validerait aussi le travail de l'appelant, qui ne pourrait plus tout annuler en cas d'échec ultérieur. Un COMMIT est d'ailleurs interdit dans un trigger (hors transaction autonome)." },
  { q: "Que donne <code>EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM :t' INTO l_nb USING 'EMPLOYES';</code> ?",
    o: ["Le nombre de lignes de EMPLOYES", "ORA-00903: invalid table name", "0", "Une injection SQL"], a: 1,
    w: "Une variable liée remplace une <strong>valeur</strong>, jamais un identifiant (table, colonne). Pour un nom d'objet, il faut concaténer après validation par DBMS_ASSERT ou une liste blanche." },
  { q: "<code>'… WHERE poste = ''' || p_poste || ''''</code> est appelé avec <code>p_poste = x' OR '1'='1</code>. Quelle est la bonne correction ?",
    o: ["Doubler les apostrophes avec REPLACE", "Passer la valeur en variable liée (<code>WHERE poste = :p … USING p_poste</code>), ou mieux, écrire la requête en SQL statique", "Mettre p_poste en majuscules", "Utiliser DBMS_ASSERT.SIMPLE_SQL_NAME sur la valeur"], a: 1,
    w: "Une valeur liée n'est jamais analysée comme du SQL. DBMS_ASSERT sert aux identifiants, pas aux valeurs ; échapper à la main est fragile." }
];

STEPPERS["savepoint"] = {
  title: "Une transaction avec SAVEPOINT, vue de deux sessions",
  code: `
-- Session A, dans SQL*Plus (pendant ce temps, une session B lit departements)
INSERT INTO departements VALUES (50, 'Marketing', 'Rennes');
SAVEPOINT avant_support;
INSERT INTO departements VALUES (60, 'Support', 'Toulouse');
UPDATE departements SET ville = 'Bordeaux' WHERE dept_id = 50;
ROLLBACK TO SAVEPOINT avant_support;
INSERT INTO departements VALUES (70, 'Finance', 'Nice');
COMMIT;`,
  steps: [
    { l: 1, n: "État initial : 4 départements validés, aucune transaction ouverte dans la session A.",
      v: { "En attente (A)": "(rien)", "Savepoints actifs": "(aucun)", "Verrous de A": "(aucun)", "Session B voit": "10, 20, 30, 40" } },
    { l: 2, n: "Premier ordre DML : la transaction <strong>commence</strong>. La ligne 50 existe pour A, mais B ne la voit pas : elle n'est pas validée.",
      v: { "En attente (A)": "50 Marketing Rennes", "Verrous de A": "ligne 50" }, o: "1 row created." },
    { l: 3, n: "On pose un repère nommé. Rien n'est validé, rien n'est écrit : c'est juste un point de retour possible.",
      v: { "Savepoints actifs": "avant_support" }, o: "Savepoint created." },
    { l: 4, n: "Deuxième INSERT, toujours dans la même transaction.",
      v: { "En attente (A)": "50 Marketing Rennes ; 60 Support Toulouse", "Verrous de A": "lignes 50, 60" }, o: "1 row created." },
    { l: 5, n: "A modifie la ligne 50 qu'il a insérée <em>avant</em> le savepoint. B, lui, n'est jamais bloqué en lecture : il continue de voir l'état validé.",
      v: { "En attente (A)": "50 Marketing Bordeaux ; 60 Support Toulouse" }, o: "1 row updated." },
    { l: 6, n: "Retour au repère : l'INSERT 60 et l'UPDATE sont annulés, la ligne 50 retrouve <code>Rennes</code>. Le savepoint reste utilisable et <strong>la transaction continue</strong> : l'INSERT 50 est toujours en attente. Les verrous pris après le savepoint sont libérés.",
      v: { "En attente (A)": "50 Marketing Rennes", "Verrous de A": "ligne 50" }, o: "Rollback complete." },
    { l: 7, n: "On reprend le travail après le retour arrière.",
      v: { "En attente (A)": "50 Marketing Rennes ; 70 Finance Nice", "Verrous de A": "lignes 50, 70" }, o: "1 row created." },
    { l: 8, n: "COMMIT : tout ce qui est en attente devient permanent et visible de B, les verrous sont libérés et les savepoints effacés. Bilan : 50 (à Rennes) et 70, ni 60 ni Bordeaux.",
      v: { "En attente (A)": "(rien)", "Savepoints actifs": "(aucun)", "Verrous de A": "(aucun)", "Session B voit": "10, 20, 30, 40, 50, 70" }, o: "Commit complete." }
  ]
};

/* ---- ch12 ---- */
QUIZ.ch12 = [
  { q: "Pourquoi <code>DBMS_OUTPUT</code> ne convient-il pas pour suivre un batch en production ?",
    o: ["Il est désactivé dans les bases de production",
        "Le tampon n'est lu par le client qu'à la fin de l'appel, et un job ou une application ne le lit jamais",
        "Il valide la transaction à chaque PUT_LINE",
        "Il est limité à 255 caractères au total"], a: 1,
    w: "Les lignes restent dans un tampon de la session jusqu'à ce qu'un client (SQL*Plus, SQL Developer) le lise, après la fin de l'appel. On utilise DBMS_APPLICATION_INFO et une table de log." },
  { q: "Un batch appelle <code>DBMS_APPLICATION_INFO.SET_MODULE('BATCH_PAIE', 'calcul')</code>. Où le DBA voit-il cette information pendant l'exécution ?",
    o: ["Dans la table JOURNAL, après le COMMIT", "Dans les colonnes MODULE et ACTION de V$SESSION, immédiatement",
        "Dans USER_ERRORS", "Uniquement dans le fichier d'alerte"], a: 1,
    w: "Les valeurs sont visibles tout de suite par les autres sessions dans V$SESSION, sans COMMIT, et reprises dans AWR/ASH." },
  { q: "Avec <code>PLSQL_WARNINGS = 'ENABLE:ALL'</code>, que signale <code>PLW-06009</code> ?",
    o: ["Du code inaccessible", "Une conversion implicite qui peut empêcher un index",
        "Un gestionnaire WHEN OTHERS qui ne se termine pas par RAISE ou RAISE_APPLICATION_ERROR",
        "Une clause AUTHID absente"], a: 2,
    w: "PLW-06009 : OTHERS handler does not end in RAISE or RAISE_APPLICATION_ERROR. Le code inaccessible est PLW-06002, la conversion PLW-07204, l'AUTHID absent PLW-05018." },
  { q: "Dans un plan <code>ALLSTATS LAST</code>, une étape montre <code>Starts = 1</code>, <code>E-Rows = 1</code>, <code>A-Rows = 50000</code>. Cause la plus probable ?",
    o: ["Statistiques absentes ou périmées sur la table", "Le hint GATHER_PLAN_STATISTICS fausse la mesure",
        "Le cache de résultats est plein", "Un index manque forcément"], a: 0,
    w: "L'optimiseur s'est trompé d'un facteur 50 000 : il a sans doute des statistiques calculées avant un chargement. On les recalcule avec DBMS_STATS, puis on vérifie le nouveau plan." },
  { q: "Dans une procédure qui déclare une variable <code>nom</code>, que fait <code>DELETE FROM employes WHERE nom = nom;</code> ?",
    o: ["Supprime les employés dont le nom vaut la variable", "Erreur de compilation : nom ambigu",
        "Supprime toutes les lignes dont le nom n'est pas NULL", "Ne supprime rien"], a: 2,
    w: "Dans un ordre SQL, la colonne masque la variable : la condition compare la colonne à elle-même. D'où les préfixes p_ et l_." },
  { q: "Quel est le problème principal d'un <code>COMMIT</code> à chaque itération d'une boucle de mise à jour ?",
    o: ["Il libère les verrous trop tard",
        "Lenteur, impossibilité d'annuler l'ensemble en cas d'erreur, et risque d'ORA-01555 sur un long curseur",
        "Il est interdit dans une boucle FOR et lève une erreur de compilation",
        "Il désactive les triggers"], a: 1,
    w: "Chaque COMMIT attend l'écriture du redo sur disque, les lignes déjà validées ne peuvent plus être annulées, et un long parcours de curseur peut échouer en snapshot too old." }
];

/* ---- ch13 ---- */
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
    a: "<p>À ancrer une variable sur une colonne (<code>l_sal employes.salaire%TYPE</code>) ou un record sur une ligne de table ou de curseur (<code>r_emp employes%ROWTYPE</code>). Si la colonne change de taille ou de type, le code suit à la recompilation.</p>" },

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
    a: "<p>Une fonction calcule et renvoie une valeur ; une procédure réalise une action. Appelée depuis SQL, une fonction ne doit avoir que des paramètres <code>IN</code> de types SQL, renvoyer un type SQL, et ne faire ni DML (ORA-14551 depuis un <code>SELECT</code>) ni <code>COMMIT</code> (ORA-14552).</p>" },
  { t: "Sous-programmes", q: "Que deviennent les paramètres <code>OUT</code> si la procédure se termine par une exception ? Et avec <code>NOCOPY</code> ?",
    a: "<p>Ils sont passés par copie et recopiés seulement à la sortie normale : la variable de l'appelant garde son ancienne valeur. Avec <code>NOCOPY</code> (simple indication), le passage se fait par référence : plus rapide pour une grosse collection, mais les modifications partielles restent visibles.</p>" },
  { t: "Sous-programmes", q: "Différence entre <code>DETERMINISTIC</code> et <code>RESULT_CACHE</code> ?",
    a: "<p><code>DETERMINISTIC</code> est une promesse à l'optimiseur (mêmes entrées, même résultat), exigée pour un index sur fonction ; le bénéfice reste limité à la requête en cours. <code>RESULT_CACHE</code> (11g) stocke vraiment les résultats en mémoire partagée entre sessions, invalidés quand les tables sources changent.</p>" },
  { t: "Sous-programmes", q: "Pourquoi une requête qui marche dans SQL Developer échoue-t-elle dans ma procédure avec ORA-00942 ?",
    a: "<p>Dans une unité <code>AUTHID DEFINER</code> (le défaut), les privilèges obtenus via un <strong>rôle</strong> sont ignorés. Il faut un <code>GRANT</code> direct à l'utilisateur propriétaire. La compilation exige toujours un <code>GRANT</code> direct, quel que soit l'<code>AUTHID</code> ; en <code>CURRENT_USER</code>, les rôles de l'appelant ne jouent qu'à l'exécution.</p>" },

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
