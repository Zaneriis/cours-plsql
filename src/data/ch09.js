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
