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
