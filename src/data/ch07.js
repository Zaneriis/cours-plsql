QUIZ.ch07 = [
  { q: "Tu recompiles uniquement le <strong>corps</strong> de <code>pkg_rh</code> (spécification inchangée). Que deviennent les procédures qui appellent <code>pkg_rh.augmenter</code> ?",
    o: ["Elles passent à INVALID et seront recompilées au prochain appel", "Elles restent VALID : elles dépendent de la spécification", "Elles sont supprimées", "Elles restent VALID seulement si elles sont dans le même schéma"], a: 1,
    w: "Les appelants dépendent de la spécification. Modifier le corps seul ne les invalide pas : c'est ce qui évite les cascades de recompilation." },
  { q: "Où place-t-on une procédure qui doit rester <strong>privée</strong> au package ?",
    o: ["Dans la spécification, avec le mot-clé PRIVATE", "Dans le corps uniquement, sans la déclarer dans la spécification", "Dans la spécification et le corps", "Dans un package séparé"], a: 1,
    w: "Tout ce qui est déclaré dans la spécification est public. Ce qui n'existe que dans le corps est privé. Il n'y a pas de mot-clé PRIVATE en PL/SQL." },
  { q: "Quand s'exécute la section d'initialisation (le <code>BEGIN … END</code> final du corps) ?",
    o: ["À chaque appel d'un sous-programme du package", "À la compilation du corps", "Une fois par session, à la première référence au package", "Une fois pour toute l'instance, au démarrage de la base"], a: 2,
    w: "Elle s'exécute à l'instanciation du package dans la session, c'est-à-dire au premier appel ou à la première lecture d'une variable du package. Une autre session la réexécute pour elle-même." },
  { q: "Une procédure de package fait <code>g_compteur := g_compteur + 1</code> puis la session exécute <code>ROLLBACK</code>. Que vaut <code>g_compteur</code> ?",
    o: ["Sa valeur d'avant l'appel", "La valeur incrémentée : une variable de package n'est pas transactionnelle", "NULL", "0, car le ROLLBACK réinitialise le package"], a: 1,
    w: "ROLLBACK n'annule que les modifications de données. L'état du package vit en mémoire de session (UGA) et ignore les transactions." },
  { q: "Après le déploiement d'une nouvelle version d'un corps de package qui contient une variable globale, une session déjà ouverte reçoit <code>ORA-04068</code>. Que se passe-t-il si elle rappelle immédiatement la même procédure ?",
    o: ["Même erreur, il faut redémarrer la base", "Même erreur jusqu'à la déconnexion de la session", "L'appel fonctionne : l'état a été réinitialisé, la variable repart de sa valeur initiale", "L'appel fonctionne avec l'ancienne valeur de la variable"], a: 2,
    w: "Le premier appel signale que l'état a été jeté. Le suivant réinstancie le package (initialisation comprise) et fonctionne, mais les valeurs des variables sont perdues." },
  { q: "Quelle paire de déclarations est une surcharge <strong>utilisable</strong> ?",
    o: ["<code>p(x IN NUMBER)</code> et <code>p(x OUT NUMBER)</code>", "<code>p(x IN NUMBER)</code> et <code>p(x IN INTEGER)</code>", "<code>f(x NUMBER) RETURN NUMBER</code> et <code>f(x NUMBER) RETURN VARCHAR2</code>", "<code>p(x IN NUMBER)</code> et <code>p(x IN DATE)</code>"], a: 3,
    w: "NUMBER et DATE sont de familles différentes : Oracle sait choisir. Un mode différent, un sous-type de la même famille (INTEGER est un sous-type de NUMBER) ou un type de retour différent rendent l'appel ambigu (PLS-00307)." }
];
STEPPERS["pkg-etat"] = {
  title: "L'état de pkg_rh dans une session",
  code: `
-- Corps de pkg_rh (extrait)
CREATE OR REPLACE PACKAGE BODY pkg_rh AS
  g_nb_appels PLS_INTEGER := 0;
  PROCEDURE augmenter (p_emp_id IN employes.emp_id%TYPE, p_pct IN NUMBER) IS
  BEGIN
    g_nb_appels := g_nb_appels + 1;
    UPDATE employes SET salaire = salaire * (1 + p_pct / 100) WHERE emp_id = p_emp_id;
  END augmenter;
  -- ... embaucher, nb_appels (RETURN g_nb_appels), etc.
BEGIN
  DBMS_OUTPUT.PUT_LINE('pkg_rh initialisé');
END pkg_rh;
/
-- Session de Léo (SET SERVEROUTPUT ON)
BEGIN
  pkg_rh.augmenter(103, 10);
  DBMS_OUTPUT.PUT_LINE('Appels : ' || pkg_rh.nb_appels);
END;
/
ROLLBACK;
BEGIN
  pkg_rh.augmenter(103, 10);
  DBMS_OUTPUT.PUT_LINE('Appels : ' || pkg_rh.nb_appels);
END;
/`,
  steps: [
    { l: 16, n: "Léo vient de se connecter. Première référence à <code>pkg_rh</code> dans sa session : le code compilé est chargé en mémoire partagée s'il n'y est pas déjà, mais sa session n'a encore <strong>aucun état</strong> pour ce package.",
      v: { "état pkg_rh": "non instancié", "salaire de 103": "3900" } },
    { l: 3, n: "Oracle instancie le package pour cette session : il réserve ses variables (en UGA) et exécute leurs initialisations.",
      v: { "état pkg_rh": "instancié", g_nb_appels: "0" } },
    { l: [10, 11, 12], n: "Puis il exécute la section d'initialisation, <strong>une seule fois</strong> pour toute la session. La ligne part dans le tampon DBMS_OUTPUT, que SQL*Plus affiche à la fin du bloc.",
      o: "pkg_rh initialisé" },
    { l: [4, 6], n: "L'appel proprement dit : <code>augmenter(103, 10)</code> incrémente le compteur.", v: { g_nb_appels: "1" } },
    { l: 7, n: "L'UPDATE modifie Durand : 3900 × 1,10. La transaction n'est pas validée.", v: { "salaire de 103": "4290 (non validé)" } },
    { l: 17, n: "<code>nb_appels</code> lit la variable du package.", o: "Appels : 1" },
    { l: 20, n: "<code>ROLLBACK</code> annule l'UPDATE. En revanche, <code>g_nb_appels</code> n'est pas une donnée de table : elle <strong>garde la valeur 1</strong>.",
      v: { "salaire de 103": "3900", g_nb_appels: "1 (inchangé)" } },
    { l: 22, n: "Deuxième bloc, même session : le package est déjà instancié. Pas de réinitialisation de la variable, pas de section d'initialisation, rien n'est affiché." },
    { l: 6, n: "Le compteur continue depuis sa valeur précédente.", v: { g_nb_appels: "2" } },
    { l: 7, n: "Nouvel UPDATE sur la valeur annulée : 3900 × 1,10.", v: { "salaire de 103": "4290 (non validé)" } },
    { l: 23, n: "Le compteur affiche 2 alors qu'une seule augmentation est réellement en cours : la variable a survécu au ROLLBACK.", o: "Appels : 2" },
    { l: [2, 3], n: "Cet état disparaît seulement à la fin de la session, avec <code>DBMS_SESSION.RESET_PACKAGE</code>, ou si le package est recompilé (le prochain appel lève alors ORA-04068). Une autre session aurait eu sa propre copie, à 0." }
  ]
};
