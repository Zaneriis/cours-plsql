QUIZ.ch01 = [
  { q: "Quelle section d'un bloc PL/SQL est obligatoire ?", o: ["DECLARE", "BEGIN … END", "EXCEPTION", "Aucune"], a: 1,
    w: "Seule la section exécutable BEGIN … END est obligatoire (avec au moins une instruction, NULL; suffit). DECLARE et EXCEPTION sont optionnelles." },
  { q: "Que provoque chaque ordre SQL exécuté depuis une boucle PL/SQL ?", o: ["Un aller-retour réseau", "Un changement de contexte entre moteur PL/SQL et moteur SQL", "Un COMMIT implicite", "Une recompilation"], a: 1,
    w: "Le bloc est envoyé en un seul appel réseau, mais chaque ordre SQL passe du moteur PL/SQL au moteur SQL : c'est le changement de contexte." },
  { q: "Dans quelle vue lit-on les erreurs de compilation d'une procédure ?", o: ["USER_SOURCE", "USER_OBJECTS", "USER_ERRORS", "V$SESSION"], a: 2,
    w: "USER_ERRORS contient ligne, position et texte des erreurs ; SHOW ERRORS en est le raccourci dans SQL*Plus / SQL Developer. USER_OBJECTS ne donne que l'état VALID / INVALID." },
  { q: "Un sous-bloc déclare l_x, déjà déclarée dans le bloc externe étiqueté <code>&lt;&lt;ext&gt;&gt;</code>. Comment lire la variable externe depuis le sous-bloc ?", o: ["Impossible", "ext.l_x", "OUTER.l_x", "l_x%OUTER"], a: 1,
    w: "On qualifie la variable par l'étiquette du bloc externe : ext.l_x." },
  { q: "Un bloc anonyme contient <code>SELECT nom FROM employes WHERE emp_id = 100;</code> sans INTO. Que se passe-t-il ?", o: ["Le nom s'affiche dans la sortie", "ORA-01403 à l'exécution", "ORA-06550 suivie de PLS-00428 : le bloc ne compile pas", "La requête est ignorée silencieusement"], a: 2,
    w: "C'est une erreur de compilation (PLS-00428). Pour un bloc anonyme, elle est enveloppée dans ORA-06550, qui donne la ligne et la colonne. Aucune instruction du bloc ne s'exécute." },
  { q: "Un traitement de 10 minutes appelle DBMS_OUTPUT.PUT_LINE à chaque tour de boucle. Quand les lignes apparaissent-elles dans SQL Developer ?", o: ["Au fur et à mesure", "Toutes à la fin de l'appel", "À chaque COMMIT", "Jamais sans DBMS_OUTPUT.FLUSH"], a: 1,
    w: "PUT_LINE remplit un tampon côté serveur ; le client le lit avec GET_LINES une fois l'appel terminé. DBMS_OUTPUT.FLUSH n'existe pas. Pour suivre l'avancement : DBMS_APPLICATION_INFO ou une table de log." }
];
STEPPERS["ch01-portee"] = {
  title: "Portée et masquage dans des blocs imbriqués",
  code: `
<<externe>>
DECLARE
  l_x NUMBER := 10;
BEGIN
  DECLARE
    l_x NUMBER := 20;   -- masque externe.l_x
    l_y NUMBER := 5;
  BEGIN
    externe.l_x := externe.l_x + l_y;
    DBMS_OUTPUT.PUT_LINE('interne : ' || l_x || ', externe : ' || externe.l_x);
  END;
  -- l_y n'existe plus ici : la référencer donnerait PLS-00201
  DBMS_OUTPUT.PUT_LINE('après : ' || l_x);
END externe;`,
  steps: [
    { l: [1, 2, 3], n: "Le bloc externe porte l'étiquette <code>externe</code>. Sa section DECLARE crée <code>l_x</code> = 10.", v: { "externe.l_x": "10" } },
    { l: [5, 6, 7], n: "Le sous-bloc déclare <strong>sa propre</strong> <code>l_x</code> = 20 et <code>l_y</code> = 5. À partir d'ici, le nom <code>l_x</code> seul désigne la variable interne : l'externe est <strong>masquée</strong>, mais toujours vivante.", v: { "l_x (interne)": "20", "l_y": "5" } },
    { l: 9, n: "<code>externe.l_x</code> qualifie le nom par l'étiquette : on modifie bien la variable <em>externe</em> (10 + 5). <code>l_y</code>, déclarée dans le sous-bloc, est visible.", v: { "externe.l_x": "15" } },
    { l: 10, n: "<code>l_x</code> seul lit la variable interne (20) ; <code>externe.l_x</code> lit l'externe (15).", o: "interne : 20, externe : 15" },
    { l: 11, n: "Fin du sous-bloc : ses variables <code>l_x</code> (interne) et <code>l_y</code> disparaissent. Plus rien ne masque <code>externe.l_x</code>.", v: { "l_x (interne)": "hors portée", "l_y": "hors portée" } },
    { l: [12, 13], n: "<code>l_x</code> désigne maintenant la variable externe, modifiée dans le sous-bloc : 15. Écrire <code>l_y</code> ici ferait échouer la <strong>compilation</strong> de tout le bloc (PLS-00201).", o: "après : 15" },
    { l: 14, n: "Fin du bloc externe. L'étiquette répétée après END est facultative mais aide à repérer les blocs longs.", v: { "externe.l_x": "hors portée" } }
  ]
};
