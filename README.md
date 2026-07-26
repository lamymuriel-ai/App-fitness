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
- **Import Apple Santé** : import ponctuel du fichier d'export de l'app Santé d'Apple (`export.zip`/`export.xml`), analysé entièrement dans le navigateur — pas, poids, sommeil, et alimentation (calories/macros/certains micronutriments, si une autre app avait déjà écrit ces données dans Santé). Une synchronisation automatique en continu n'est pas possible : HealthKit n'est accessible qu'aux applications natives iOS, pas aux PWA. Les ré-imports remplacent les données du même jour plutôt que de les dupliquer.
- **Aide-mémoire** : rappels de méthode et erreurs fréquentes à éviter.

L'application ne pose aucun diagnostic médical et ne remplace pas un avis professionnel de santé — elle se limite à du suivi factuel.

## Notes techniques

- React + TypeScript + Vite, routage via `react-router-dom` (HashRouter, compatible hébergement statique).
- Persistance locale via IndexedDB (`idb`).
- PWA installable (`vite-plugin-pwa`).
- Scan de code-barres via `@zxing/browser` (caméra) avec repli en saisie manuelle du code.
- Import Apple Santé via `fflate` (décompression du `.zip` côté client) et analyse du XML par expressions régulières (évite de charger un DOM complet pour de gros fichiers), voir `src/utils/appleHealthImport.ts`.
- L'estimation nutritionnelle à partir d'une photo est une estimation heuristique locale (aucune clé d'API de vision n'est configurée) — elle est toujours présentée comme approximative et modifiable avant l'enregistrement. Le point d'intégration pour brancher un vrai modèle de vision se trouve dans `src/utils/photoEstimate.ts`.
