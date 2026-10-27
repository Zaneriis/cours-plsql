/* Données des quiz, animations pas à pas et flashcards. Chaque chapitre a son propre fichier src/data/chNN.js. */
window.QUIZ = {};
window.STEPPERS = {};
window.FLASH = [];

/* ---- ch01 ---- */
QUIZ.ch01 = [
  { q: "Quelle section d'un bloc PL/SQL est obligatoire ?", o: ["DECLARE", "BEGIN … END", "EXCEPTION", "Aucune"], a: 1,
    w: "Seule la section exécutable BEGIN … END est obligatoire. DECLARE et EXCEPTION sont optionnelles." },
  { q: "Que provoque chaque ordre SQL exécuté depuis une boucle PL/SQL ?", o: ["Un aller-retour réseau", "Un changement de contexte entre moteur PL/SQL et moteur SQL", "Un COMMIT implicite", "Une recompilation"], a: 1,
    w: "Le bloc est envoyé en un seul appel réseau, mais chaque ordre SQL passe du moteur PL/SQL au moteur SQL : c'est le changement de contexte." },
  { q: "Dans quelle vue lit-on les erreurs de compilation d'une procédure ?", o: ["USER_SOURCE", "USER_OBJECTS", "USER_ERRORS", "V$SESSION"], a: 2,
    w: "USER_ERRORS contient ligne, position et texte des erreurs ; SHOW ERRORS en est le raccourci dans SQL*Plus / SQL Developer." },
  { q: "Un sous-bloc déclare l_x, déjà déclarée dans le bloc externe étiqueté <<ext>>. Comment lire la variable externe depuis le sous-bloc ?", o: ["Impossible", "ext.l_x", "OUTER.l_x", "l_x%OUTER"], a: 1,
    w: "On qualifie la variable par l'étiquette du bloc externe : ext.l_x." }
];

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
    w: "32 767 octets en PL/SQL, alors qu'une colonne SQL est limitée à 4 000 octets (32 767 en mode MAX_STRING_SIZE = EXTENDED)." }
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
    { l: 5, n: "<code>NULL > 500</code> donne NULL. Un IF n'entre que si la condition est TRUE : on passe à la branche suivante.", v: { "condition": "NULL" } },
    { l: 7, n: "<code>NOT (NULL)</code> reste NULL. Toujours pas TRUE : branche suivante.", v: { "condition": "NULL" } },
    { l: [9, 10], n: "Aucune condition n'était vraie : la branche ELSE s'exécute.", o: "Commission inconnue" },
    { l: 12, n: "<code>NVL</code> remplace NULL par 0.", v: { l_comm: "0" } },
    { l: 13, n: "La valeur est maintenant connue, les comparaisons redeviennent normales.", o: "Après NVL : 0" }
  ]
};

/* ---- ch03 ---- */
QUIZ.ch03 = [
  { q: "Combien de fois s'exécute <code>FOR i IN 5 .. 1 LOOP</code> ?", o: ["5 fois, en descendant", "0 fois", "1 fois", "Erreur de compilation"], a: 1,
    w: "Si la borne basse dépasse la borne haute, la boucle ne s'exécute pas. Pour descendre : FOR i IN REVERSE 1 .. 5." },
  { q: "Que se passe-t-il si on écrit <code>i := 10;</code> dans une boucle FOR i ?", o: ["La boucle s'arrête", "La boucle saute à 10", "Erreur de compilation PLS-00363", "Rien"], a: 2,
    w: "L'indice d'une boucle FOR est en lecture seule." },
  { q: "Une instruction <code>CASE … END CASE;</code> sans ELSE ne trouve aucune branche. Résultat ?", o: ["Rien ne se passe", "Elle renvoie NULL", "Exception CASE_NOT_FOUND", "Exception NO_DATA_FOUND"], a: 2,
    w: "L'instruction CASE lève CASE_NOT_FOUND (ORA-06592). L'expression CASE, elle, renverrait NULL." },
  { q: "Comment quitter deux boucles imbriquées d'un coup ?", o: ["EXIT; EXIT;", "EXIT nom_etiquette; avec la boucle externe étiquetée", "RETURN uniquement", "C'est impossible"], a: 1,
    w: "On étiquette la boucle externe <<lignes>> et on écrit EXIT lignes; (ou EXIT lignes WHEN …)." }
];
STEPPERS["loop-continue"] = {
  title: "FOR, CONTINUE et EXIT",
  code: `
DECLARE
  l_somme PLS_INTEGER := 0;
BEGIN
  FOR i IN 1 .. 6 LOOP
    CONTINUE WHEN MOD(i, 2) = 0;     -- saute les pairs
    EXIT WHEN i > 4;                 -- s'arrête après 4
    l_somme := l_somme + i;
    DBMS_OUTPUT.PUT_LINE('i=' || i || ' somme=' || l_somme);
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total : ' || l_somme);
END;`,
  steps: [
    { l: 2, n: "Initialisation de l'accumulateur.", v: { l_somme: "0" } },
    { l: 4, n: "Entrée dans la boucle : bornes 1 et 6 évaluées une seule fois. i = 1.", v: { i: "1" } },
    { l: 5, n: "MOD(1, 2) = 1 : pas de CONTINUE." },
    { l: 6, n: "1 > 4 ? Non : on continue." },
    { l: 7, n: "l_somme = 0 + 1.", v: { l_somme: "1" } },
    { l: 8, n: "Affichage.", o: "i=1 somme=1" },
    { l: 4, n: "Itération suivante : i = 2.", v: { i: "2" } },
    { l: 5, n: "MOD(2, 2) = 0 : CONTINUE, on saute directement à l'itération suivante." },
    { l: 4, n: "i = 3.", v: { i: "3" } },
    { l: [5, 6], n: "Impair, et 3 n'est pas > 4." },
    { l: [7, 8], n: "l_somme = 1 + 3.", v: { l_somme: "4" }, o: "i=3 somme=4" },
    { l: [4, 5], n: "i = 4 : pair, CONTINUE.", v: { i: "4" } },
    { l: 4, n: "i = 5.", v: { i: "5" } },
    { l: 6, n: "5 > 4 : EXIT, on sort de la boucle. L'itération 6 n'aura jamais lieu." },
    { l: 10, n: "Après la boucle. La variable i n'existe plus ici.", v: { i: "(hors portée)" }, o: "Total : 4" }
  ]
};
