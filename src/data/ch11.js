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
