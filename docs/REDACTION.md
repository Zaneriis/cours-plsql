# Guide de rédaction du cours PL/SQL

Ce guide s'adresse à toute personne (ou agent) qui écrit, relit ou corrige un chapitre.

## Public et objectif

- Lecteur : développeur de niveau **débutant confirmé** en PL/SQL qui prépare un **entretien d'embauche**. Il veut se remettre les bases en mémoire puis aller plus loin.
- Langue : **français**, tutoiement (« tu »), phrases complètes et directes. Pas de tirets cadratins (—) pour les incises, pas de formules creuses. Vocabulaire Oracle exact (on garde les mots-clés en anglais : `BULK COLLECT`, *trigger*, *package*…).
- Oracle cible : 19c et 23ai, en signalant la version quand une fonctionnalité est récente (11g, 12c, 18c, 21c, 23ai).

## Fichiers

| Fichier | Contenu |
|---|---|
| `src/chapters/chNN.html` | Le chapitre : une `<section class="chapter">` complète |
| `src/data/chNN.js` | Quiz (`QUIZ.chNN`) et animations pas à pas (`STEPPERS["id"]`) du chapitre ; `FLASH` (flashcards) pour ch13 |
| `src/_head.html`, `src/_foot.html` | En-tête et pied communs : ne pas modifier sans raison |
| `assets/app.js`, `assets/style.css` | Moteur du site : ne pas modifier depuis un chapitre |
| `index.html`, `assets/data.js` | **Générés** par `python3 tools/build.py` : ne jamais les éditer à la main |

Vérification : `node tools/check.js chNN` (construit dans un dossier temporaire, ouvre Chromium, vérifie erreurs JS, quiz, animations, diagrammes Mermaid).

## Structure d'un chapitre

```html
<section class="chapter" id="chNN" data-num="NN" data-group="…" data-min="60" data-title="…" data-desc="…" hidden>
  <p class="eyebrow">Chapitre NN · 60 min</p>
  <h1>Titre</h1>
  <p class="lead">Accroche : pourquoi ce chapitre compte en entretien.</p>
  <ul class="goals"><li>objectif concret</li>…</ul>

  <h2>Section de cours</h2> … explications, exemples, diagrammes, encadrés …

  <h2>Exercices</h2>   3 à 5 exercices, difficulté croissante
  <h2>Quiz</h2>        <div data-quiz="chNN"></div>
  <h2>Questions d'entretien</h2>  3 à 5 <details class="qa">
</section>
```

Le pied de chapitre (bouton « terminé », navigation) est ajouté automatiquement par `app.js`.

### Composants disponibles

- **Code** : `<script type="text/plsql" data-title="Titre du bloc"> … </script>`. Le contenu est brut (pas d'échappement HTML nécessaire, sauf `</script>` interdit). Il est désindenté et coloré automatiquement.
- **Sortie attendue** : `<div class="output">…</div>` juste après le bloc de code. Les sorties doivent être **exactes** par rapport au schéma d'exemple (chapitre 00).
- **Encadrés** : `<div class="callout pitfall|tip|interview"><span class="ct">Titre</span><p>…</p></div>` (Piège / Astuce / En entretien).
- **Tableau** : toujours dans `<div class="table-wrap"><table>…</table></div>`.
- **Diagramme Mermaid** : `<div class="diagram"><pre class="mermaid">…</pre><p class="cap">Légende</p></div>`. Éviter le caractère `<` suivi d'une lettre dans le texte Mermaid (HTML) ; utiliser `<br/>` pour les retours à la ligne dans les nœuds, guillemets autour des libellés contenant des caractères spéciaux.
- **Exercice** :
  ```html
  <div class="ex" data-ex="chNN-eK">
    <div class="ex-head"><h4>Exercice K · Titre</h4><span class="lvl l1|l2|l3">facile|moyen|difficile</span></div>
    <div class="ex-body"><p>Énoncé</p>
      <details class="sol"><summary>Voir la solution</summary> … </details>
    </div>
  </div>
  ```
  **Les identifiants `data-ex` ne doivent jamais changer une fois publiés** (ils servent à la progression enregistrée). On peut en ajouter de nouveaux (`chNN-e5`…).
- **Question d'entretien** : `<details class="qa"><summary>Question ?</summary><div><p>Réponse</p></div></details>`
- **Animation pas à pas** : `<div data-stepper="id"></div>` dans le HTML, et dans `src/data/chNN.js` :
  ```js
  STEPPERS["id"] = {
    title: "Titre",
    code: `…code…`,            // les numéros de ligne commencent à 1 après suppression de la première ligne vide
    table: { cols: ["nom", "salaire"], rows: [["Durand", "3900"]], caption: "optionnel" },  // optionnel
    steps: [
      { l: 3, n: "Explication HTML de l'étape", v: { variable: "valeur" }, o: "ligne de sortie", p: 0 },
      // l : ligne ou tableau de lignes surlignées ; v : variables modifiées (cumulées) ;
      // o : ligne ajoutée à la console (préfixe "!" = erreur en rouge) ; p : index de la ligne pointée dans table
    ]
  };
  ```
- **Quiz** : dans `src/data/chNN.js`
  ```js
  QUIZ.chNN = [ { q: "Question (HTML)", o: ["choix 1", "choix 2", …], a: 1 /* index de la bonne réponse */, w: "Explication" } ];
  ```
  4 à 6 questions, une seule bonne réponse, distracteurs plausibles.

## Schéma d'exemple (référence pour toutes les sorties)

`departements` : (10 Direction Paris), (20 Informatique Lyon), (30 Ventes Lille), (40 RH Nantes, **aucun employé**).

| emp_id | nom | prenom | poste | salaire | commission | date_embauche | dept_id | manager_id |
|---|---|---|---|---|---|---|---|---|
| 100 | Martin | Claire | DG | 9500 | | 2015-03-01 | 10 | |
| 101 | Bernard | Hugo | DIR_IT | 7200 | | 2016-06-15 | 20 | 100 |
| 105 | Moreau | Lucas | DIR_VENTES | 6800 | | 2017-02-01 | 30 | 100 |
| 102 | Petit | Sarah | DEV | 4300 | | 2019-09-02 | 20 | 101 |
| 103 | Durand | Karim | DEV | 3900 | | 2021-01-11 | 20 | 101 |
| 104 | Leroy | Emma | DBA | 4800 | | 2018-04-23 | 20 | 101 |
| 106 | Simon | Julie | COMMERCIAL | 3100 | 450 | 2020-05-18 | 30 | 105 |
| 107 | Laurent | Nicolas | COMMERCIAL | 2900 | 600 | 2022-10-03 | 30 | 105 |
| 108 | Michel | Inès | COMMERCIAL | 3000 | | 2023-02-20 | 30 | 105 |
| 109 | Garcia | Tom | STAGIAIRE | 1400 | | 2024-09-01 | 20 | 102 |

Autres objets : `journal_erreurs(id IDENTITY, date_err, programme, code, message, backtrace)`, `historique_salaires(emp_id, ancien_salaire, nouveau_salaire, date_modif, modifie_par)`, séquence `seq_employes` (début 200), contrainte `ck_emp_salaire CHECK (salaire > 0)`.

Chaque exemple part de cet état initial, sauf mention contraire (et se termine par `ROLLBACK` s'il modifie des données). Masse salariale totale : 46 900. Département 20 : 5 employés, moyenne 4 320.

## Objets créés par les chapitres (à réutiliser, ne pas redéfinir différemment)

- ch04 : fonctions `employes_du_dept`, `rechercher_employes`
- ch05 : procédure `log_erreur(p_programme)` (transaction autonome), procédure `embaucher` (autonome, hors package), fonction `diviser`
- ch06 : `augmenter_salaire(p_emp_id, p_pct DEFAULT 5, p_nouveau OUT)`, `anciennete(p_emp_id)`, `calcul_prime`, `stats_dept`, `annees_depuis(p_debut, p_fin)`, `nom_departement`
- ch07 : packages `pkg_rh`, `pkg_dates`, `pkg_cache_dept`
- ch08 : type SQL `t_liste_id AS TABLE OF NUMBER`
- ch09 : types `t_ligne_paie`, `t_paies`, fonction `echeancier`, tables `employes_archive` et `err$_employes` (DBMS_ERRLOG)
- ch10 : triggers `trg_employes_bi`, `trg_employes_audit_sal`, `trg_sal_plafond`, vue `v_employes_dept`
- ch11 : `nb_lignes`, `chercher`, `compter_par_poste`
- ch12 : package `pkg_log`, table `journal`
- ch13 : package `pkg_augmentations`, procédure `prime_fin_annee`

## Exigences de qualité

1. Exactitude technique Oracle (codes d'erreur, comportements, versions). En cas de doute, ne pas affirmer.
2. Tout code doit compiler et s'exécuter sur le schéma d'exemple ; toute sortie affichée doit être celle qu'Oracle produirait.
3. Chaque chapitre : explications claires, exemples exécutables, au moins un visuel (diagramme Mermaid, tableau ou animation), 3 à 5 exercices avec solution commentée, un quiz, des questions d'entretien, des encadrés « Piège » sur les erreurs classiques.
4. Pas de contradiction avec les autres chapitres ; renvoyer vers le chapitre qui détaille une notion plutôt que de la redévelopper (`<a href="#chNN">chapitre NN</a>`).
5. Accessibilité et rendu : aucune ligne de code de plus d'environ 110 caractères, HTML bien fermé.
