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
