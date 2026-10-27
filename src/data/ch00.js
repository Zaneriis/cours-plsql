QUIZ.ch00 = [
  { q: "Ton bloc contient <code>DBMS_OUTPUT.PUT_LINE('ok')</code>, il se termine sans erreur, mais rien ne s'affiche. Cause la plus probable ?",
    o: ["Il manque un COMMIT après le bloc", "SET SERVEROUTPUT ON n'a pas été exécuté dans la session", "DBMS_OUTPUT n'est disponible qu'en 23ai", "Le tampon est limité à 255 caractères"], a: 1,
    w: "PUT_LINE écrit dans un tampon côté serveur ; le client ne le lit et ne l'affiche que si SERVEROUTPUT est activé pour la session. COMMIT n'a aucun rapport avec l'affichage." },
  { q: "Avec le conteneur <code>gvenzl/oracle-free</code>, à quel service te connectes-tu pour créer tes tables ?",
    o: ["FREE", "FREEPDB1", "XE", "CDB$ROOT"], a: 1,
    w: "FREEPDB1 est la base enfichable (PDB) où l'image crée l'utilisateur applicatif. FREE est le conteneur racine : un CREATE USER classique y échoue avec ORA-65096." },
  { q: "Dans un script SQL*Plus ou SQLcl, à quoi sert le <code>/</code> seul sur sa ligne après <code>END;</code> ?",
    o: ["C'est la fin obligatoire de tout bloc PL/SQL", "Il valide la transaction comme un COMMIT", "Il demande au client d'envoyer le bloc au serveur pour exécution", "Il commente la ligne suivante"], a: 2,
    w: "Le / est une commande du client, pas du PL/SQL : elle envoie le contenu du tampon (le bloc) au serveur. END; termine le bloc côté langage." },
  { q: "<code>SELECT table_name FROM user_tables WHERE table_name = 'employes';</code> ne renvoie aucune ligne alors que la table existe. Pourquoi ?",
    o: ["USER_TABLES ne liste que les tables système", "Il faut interroger ALL_TABLES", "Les noms d'objets sont stockés en majuscules dans le dictionnaire", "La table n'est visible qu'après un COMMIT"], a: 2,
    w: "Sans guillemets doubles à la création, Oracle stocke le nom en majuscules : il faut filtrer sur 'EMPLOYES'. Un CREATE TABLE fait de toute façon un COMMIT implicite." }
];
