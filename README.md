# Cours PL/SQL

Parcours de révision PL/SQL en français pour préparer un entretien : 14 chapitres avec cours, exemples exécutables, exercices corrigés, quiz, animations pas à pas, diagrammes et un chapitre spécial entretien (flashcards, SQL incontournable, pièges, cas pratique).

La progression (chapitres terminés, exercices faits, scores de quiz, flashcards maîtrisées) est enregistrée dans le navigateur. Les boutons « Sauvegarder » et « Importer » du sommaire permettent de la transférer d'un appareil à l'autre.

## Consulter le site

- **En ligne** : activer GitHub Pages une fois (Settings › Pages › Build and deployment › Source : *Deploy from a branch*, branche `main`, dossier `/ (root)`). Le site est ensuite servi à `https://zaneriis.github.io/cours-plsql/`.
- **En local** : ouvrir `index.html` dans un navigateur, ou lancer `python3 -m http.server` à la racine puis aller sur http://localhost:8000.

## Programme

| # | Chapitre |
|---|---|
| 00 | Préparer son environnement (base Oracle gratuite, schéma d'exemple) |
| 01 | Architecture et bloc PL/SQL |
| 02 | Variables, types et NULL |
| 03 | Structures de contrôle |
| 04 | SQL dans PL/SQL et curseurs |
| 05 | Gestion des exceptions |
| 06 | Procédures et fonctions |
| 07 | Packages |
| 08 | Records et collections |
| 09 | Performance : BULK COLLECT et FORALL |
| 10 | Triggers |
| 11 | Transactions et SQL dynamique |
| 12 | Bonnes pratiques et optimisation |
| 13 | Spécial entretien |

## Modifier le contenu

Les sources sont dans `src/` ; `index.html` et `assets/data.js` sont générés.

```bash
# éditer src/chapters/chNN.html et src/data/chNN.js, puis :
python3 tools/build.py          # régénère index.html et assets/data.js
node tools/check.js             # vérifie le site dans Chromium (nécessite playwright)
```

Les conventions de rédaction (composants, schéma d'exemple, règles de qualité) sont décrites dans [docs/REDACTION.md](docs/REDACTION.md).

## Structure

```
index.html            page générée (ne pas éditer)
assets/
  style.css           mise en forme, thèmes clair et sombre
  app.js              navigation, progression, quiz, animations, coloration PL/SQL
  data.js             quiz, animations et flashcards (généré)
  vendor/mermaid.min.js  diagrammes (Mermaid 10.9.1, licence MIT)
src/
  _head.html, _foot.html
  chapters/           un fichier HTML par chapitre
  data/               un fichier JS par chapitre
tools/                build.py, check.js
docs/REDACTION.md     guide de rédaction
```
