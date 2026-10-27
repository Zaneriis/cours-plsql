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
