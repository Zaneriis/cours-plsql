QUIZ.ch10 = [
  { q: "Un <code>UPDATE</code> modifie 2 lignes. La table a un trigger de chaque type (BEFORE/AFTER, STATEMENT/ROW). Dans quel ordre s'exécutent-ils ?",
    o: ["BS, AS, puis BR et AR pour chaque ligne",
        "BS, puis BR + AR pour la ligne 1, puis BR + AR pour la ligne 2, puis AS",
        "BS, BR ligne 1, BR ligne 2, AR ligne 1, AR ligne 2, AS",
        "BR et AR pour chaque ligne, puis BS et AS"], a: 1,
    w: "BEFORE STATEMENT une fois, puis pour chaque ligne : BEFORE ROW, écriture de la ligne, AFTER ROW. Enfin AFTER STATEMENT une fois." },
  { q: "Dans quel type de trigger peut-on écrire <code>:NEW.nom := UPPER(:NEW.nom);</code> ?",
    o: ["BEFORE … FOR EACH ROW uniquement", "AFTER … FOR EACH ROW uniquement", "Tout trigger de ligne", "Tout trigger, ligne ou instruction"], a: 0,
    w: "La ligne n'est pas encore écrite en BEFORE ROW : on peut changer :NEW. En AFTER ROW, c'est trop tard (ORA-04084 à la compilation). Un trigger d'instruction n'a pas du tout accès à :NEW." },
  { q: "Un trigger <code>BEFORE UPDATE … FOR EACH ROW</code> sur <code>employes</code> fait <code>SELECT AVG(salaire) FROM employes</code>. Que se passe-t-il à l'exécution d'un <code>UPDATE employes</code> ?",
    o: ["Il lit les anciennes valeurs, sans erreur", "Il lit les valeurs déjà modifiées, sans erreur", "ORA-04091 : la table est en mutation", "Le trigger ne compile pas"], a: 2,
    w: "Le trigger compile, mais à l'exécution un trigger de ligne ne peut pas interroger la table en cours de modification : ORA-04091 (table mutante)." },
  { q: "Un trigger AFTER INSERT contient un <code>COMMIT</code>. Que se passe-t-il à la première insertion ?",
    o: ["La ligne est validée immédiatement", "Le COMMIT est ignoré", "ORA-04092 : impossible de valider dans un trigger", "Le trigger est désactivé automatiquement"], a: 2,
    w: "Un trigger fait partie de la transaction de l'ordre déclencheur : COMMIT et ROLLBACK y sont interdits (ORA-04092), sauf dans un trigger déclaré en transaction autonome." },
  { q: "Quelle clause <code>WHEN</code> est correcte dans un trigger de ligne ?",
    o: ["<code>WHEN (:NEW.salaire > 5000)</code>", "<code>WHEN (NEW.salaire > 5000)</code>", "<code>WHEN NEW.salaire > 5000</code>", "<code>WHEN :NEW.salaire > 5000 THEN</code>"], a: 1,
    w: "Dans la clause WHEN, NEW et OLD s'écrivent sans deux-points et la condition est entre parenthèses. Dans le corps du trigger, on écrit :NEW et :OLD." },
  { q: "Un trigger <code>BEFORE UPDATE ON employes</code> (sans FOR EACH ROW) affiche un message. On lance <code>UPDATE employes SET salaire = 0 WHERE dept_id = 40;</code> (département vide). Combien de messages ?",
    o: ["0, aucune ligne n'est touchée", "1", "Autant que d'employés dans la table", "Une erreur ORA-01403"], a: 1,
    w: "Un trigger d'instruction se déclenche une fois par ordre DML, même si l'ordre ne touche aucune ligne. Les triggers de ligne, eux, ne se déclencheraient pas." }
];

STEPPERS["trigger-order"] = {
  title: "Ordre de déclenchement sur un UPDATE de 2 lignes",
  code: `
CREATE OR REPLACE TRIGGER t_bs BEFORE UPDATE ON employes
BEGIN
  DBMS_OUTPUT.PUT_LINE('BEFORE STATEMENT');
END;
/
CREATE OR REPLACE TRIGGER t_br BEFORE UPDATE ON employes FOR EACH ROW
BEGIN
  DBMS_OUTPUT.PUT_LINE('BEFORE ROW ' || :OLD.emp_id || ' : ' || :OLD.salaire || ' -> ' || :NEW.salaire);
END;
/
CREATE OR REPLACE TRIGGER t_ar AFTER UPDATE ON employes FOR EACH ROW
BEGIN
  DBMS_OUTPUT.PUT_LINE('AFTER ROW ' || :NEW.emp_id);
END;
/
CREATE OR REPLACE TRIGGER t_as AFTER UPDATE ON employes
BEGIN
  DBMS_OUTPUT.PUT_LINE('AFTER STATEMENT');
END;
/
UPDATE employes SET salaire = salaire + 100 WHERE emp_id IN (102, 103);`,
  table: { cols: ["emp_id", "nom", "salaire"], rows: [["102", "Petit", "4300"], ["103", "Durand", "3900"]], caption: "Lignes visées par l'UPDATE (état initial)" },
  steps: [
    { l: 21, n: "L'ordre <code>UPDATE</code> démarre. Oracle sait déjà quels triggers existent sur <code>employes</code> pour l'événement UPDATE : les quatre vont intervenir." },
    { l: [1, 3], n: "<b>BEFORE STATEMENT</b> : une seule fois, avant toute ligne. Pas de <code>:OLD</code> ni de <code>:NEW</code> ici : on ne sait pas encore quelles lignes seront touchées.", o: "BEFORE STATEMENT" },
    { l: 21, n: "Première ligne trouvée (l'ordre de parcours des lignes n'est pas garanti ; ici 102). Oracle calcule <code>salaire + 100</code> : <code>:OLD</code> contient la valeur en base, <code>:NEW</code> la valeur proposée.", p: 0,
      v: { "emp_id": "102", ":OLD.salaire": "4300", ":NEW.salaire": "4400" } },
    { l: [6, 8], n: "<b>BEFORE ROW</b> pour 102. C'est le seul endroit où l'on pourrait encore modifier <code>:NEW.salaire</code>.", p: 0, o: "BEFORE ROW 102 : 4300 -> 4400" },
    { l: 21, n: "Oracle écrit la ligne 102 (salaire 4400) et vérifie ses contraintes, par exemple <code>ck_emp_salaire</code>.", p: 0 },
    { l: [11, 13], n: "<b>AFTER ROW</b> pour 102. La ligne est écrite : <code>:NEW</code> est en lecture seule. Idéal pour l'audit.", p: 0, o: "AFTER ROW 102" },
    { l: 21, n: "Ligne suivante : 103. Nouvelles valeurs de <code>:OLD</code> et <code>:NEW</code>.", p: 1,
      v: { "emp_id": "103", ":OLD.salaire": "3900", ":NEW.salaire": "4000" } },
    { l: [6, 8], n: "<b>BEFORE ROW</b> pour 103.", p: 1, o: "BEFORE ROW 103 : 3900 -> 4000" },
    { l: 21, n: "Écriture de la ligne 103 (salaire 4000) et contrôle des contraintes.", p: 1 },
    { l: [11, 13], n: "<b>AFTER ROW</b> pour 103.", p: 1, o: "AFTER ROW 103" },
    { l: [16, 18], n: "<b>AFTER STATEMENT</b> : une seule fois, après toutes les lignes. Plus de <code>:OLD</code> / <code>:NEW</code>, mais la table peut de nouveau être lue sans ORA-04091.",
      v: { "emp_id": "(inaccessible)", ":OLD.salaire": "(inaccessible)", ":NEW.salaire": "(inaccessible)" }, o: "AFTER STATEMENT" },
    { l: 21, n: "Fin de l'ordre : 2 lignes mises à jour. SQL*Plus affiche son message de retour, puis le tampon DBMS_OUTPUT. Pense à <code>ROLLBACK</code> et à supprimer ces quatre triggers de démonstration." }
  ]
};
