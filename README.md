# Léa Forme — Suivi de perte de graisse

Application mobile (PWA responsive) de suivi quotidien de perte de graisse, en français : nutrition (journal alimentaire avec photo/scan/saisie manuelle), entraînement (3 séances hebdomadaires), poids/tour de taille, et alerte de stagnation.

Toutes les données sont stockées localement dans le navigateur (IndexedDB) — rien n'est envoyé à un serveur.

## Démarrer en local

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (par défaut http://localhost:5173).

## Build de production

```bash
npm run build
npm run preview
```

## Fonctionnalités

- **Tableau de bord** : calories/macros du jour, pas, séance du jour.
- **Journal alimentaire** : ajout d'un repas par photo (estimation automatique à corriger), scan de code-barres (base [Open Food Facts](https://world.openfoodfacts.org/)), ou saisie manuelle. Suivi des macronutriments et de 12 micronutriments clés, avec détection des apports faibles/élevés sur la semaine.
- **Entraînement** : 3 séances préremplies (2 en salle, 1 à la maison), poids mémorisé par exercice, cases à cocher par série, historique des séances.
- **Suivi hebdomadaire** : pesée, moyenne mobile sur 7 jours, tour de taille, ressenti, sommeil, graphiques d'évolution.
- **Alerte de stagnation** : si la moyenne de poids ne baisse pas sur 2 semaines, l'appli propose un seul ajustement (calories ou pas) à la fois.
- **Import Apple Santé** : import ponctuel du fichier d'export de l'app Santé d'Apple (`export.zip`/`export.xml`), analysé entièrement dans le navigateur — pas, poids, sommeil, et alimentation. L'alimentation (calories/macros/certains micronutriments) reconstitue un repas par entrée réelle (nom, heure, macros) si une autre app comme Micron ou MyFitnessPal avait déjà écrit ces données dans Santé, en gérant à la fois les entrées groupées en `HKCorrelationTypeIdentifierFood` et les enregistrements isolés. Les ré-imports remplacent les entrées déjà importées plutôt que de les dupliquer.
- **Raccourci iOS** : route `/import-rapide` qui lit `pas`/`poids`/`sommeil`/`date` en paramètres d'URL et les enregistre immédiatement — permet à un Raccourci iOS (app Raccourcis d'Apple, qui a accès à HealthKit) d'envoyer les données du jour en un tap, sans passer par l'export/import de fichier. Guide de configuration dans l'appli (Plus → Raccourci iOS). Une synchronisation automatique en continu reste impossible : HealthKit n'est accessible qu'aux applications natives iOS, pas aux PWA — ce sont les deux seuls contournements disponibles.
- **Aide-mémoire** : rappels de méthode et erreurs fréquentes à éviter.

L'application ne pose aucun diagnostic médical et ne remplace pas un avis professionnel de santé — elle se limite à du suivi factuel.

## Notes techniques

- React + TypeScript + Vite, routage via `react-router-dom` (HashRouter, compatible hébergement statique).
- Persistance locale via IndexedDB (`idb`).
- PWA installable (`vite-plugin-pwa`).
- Scan de code-barres via `@zxing/browser` (caméra) avec repli en saisie manuelle du code.
- Import Apple Santé entièrement en flux (streaming), dans un Web Worker (`src/workers/appleHealthWorker.ts`) : le `File` est transmis tel quel au Worker (jamais chargé en mémoire sur le thread principal) et lu par petits morceaux de taille fixe (32 Ko, découpés nous-mêmes via `file.slice()` plutôt que de dépendre du découpage natif de `file.stream()` — celui-ci varie selon le navigateur, et un morceau trop gros peut, une fois décompressé, produire un sursaut mémoire démesuré sur un fichier très compressible), poussés dans `fflate.Unzip` qui restitue le XML décompressé par morceaux via son callback `ondata` — jamais comme une seule chaîne complète, à aucune étape. Un scanner regex incrémental (`AnalyseurSanteIncremental` dans `src/utils/appleHealthParser.ts`) traite chaque morceau au fil de l'eau, ne gardant en mémoire qu'un petit reliquat (une balise coupée pile à la frontière entre deux morceaux). C'est indispensable pour un long historique Apple Watch : un `.zip` de quelques centaines de Mo peut se décompresser en plusieurs Go de XML (données très répétitives), largement au-delà de ce qu'un téléphone peut tenir en mémoire — et les limites mémoire d'iOS Safari pour un Worker sont plus strictes que celles d'un navigateur desktop, donc chaque étape (lecture du fichier, décompression, parsing) reste bornée en mémoire indépendamment de la taille totale. Une vraie barre de progression accompagne l'analyse. Le morceau réellement poussé à `fflate.Unzip` avec `final: true` est toujours celui qui contient les derniers octets du fichier (jamais un morceau vide poussé après coup), sans quoi le décodeur DEFLATE de fflate ne peut pas flusher son dernier bloc partiel et renvoie une erreur « unexpected EOF ». Voir `src/utils/appleHealthImport.ts` pour l'API côté thread principal (lance le Worker, relaie la progression).
- L'estimation nutritionnelle à partir d'une photo est une estimation heuristique locale (aucune clé d'API de vision n'est configurée) — elle est toujours présentée comme approximative et modifiable avant l'enregistrement. Le point d'intégration pour brancher un vrai modèle de vision se trouve dans `src/utils/photoEstimate.ts`.
