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
