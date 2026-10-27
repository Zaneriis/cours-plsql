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
