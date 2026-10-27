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
