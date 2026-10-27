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
