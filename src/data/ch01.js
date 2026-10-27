QUIZ.ch01 = [
  { q: "Quelle section d'un bloc PL/SQL est obligatoire ?", o: ["DECLARE", "BEGIN … END", "EXCEPTION", "Aucune"], a: 1,
    w: "Seule la section exécutable BEGIN … END est obligatoire. DECLARE et EXCEPTION sont optionnelles." },
  { q: "Que provoque chaque ordre SQL exécuté depuis une boucle PL/SQL ?", o: ["Un aller-retour réseau", "Un changement de contexte entre moteur PL/SQL et moteur SQL", "Un COMMIT implicite", "Une recompilation"], a: 1,
    w: "Le bloc est envoyé en un seul appel réseau, mais chaque ordre SQL passe du moteur PL/SQL au moteur SQL : c'est le changement de contexte." },
  { q: "Dans quelle vue lit-on les erreurs de compilation d'une procédure ?", o: ["USER_SOURCE", "USER_OBJECTS", "USER_ERRORS", "V$SESSION"], a: 2,
    w: "USER_ERRORS contient ligne, position et texte des erreurs ; SHOW ERRORS en est le raccourci dans SQL*Plus / SQL Developer." },
  { q: "Un sous-bloc déclare l_x, déjà déclarée dans le bloc externe étiqueté <<ext>>. Comment lire la variable externe depuis le sous-bloc ?", o: ["Impossible", "ext.l_x", "OUTER.l_x", "l_x%OUTER"], a: 1,
    w: "On qualifie la variable par l'étiquette du bloc externe : ext.l_x." }
];
