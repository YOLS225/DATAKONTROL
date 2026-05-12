# 📦 Samples — Challenge Technique Artefact CI

Ce dossier contient les données de test pour le challenge.

## Contenu

### Source 1 — Ventes Orange CI

- `source-ventes-orange.json` — Schéma de la source (à intégrer dans ton système)
- `ventes-orange-clean.csv` — Fichier propre, **doit passer la validation à 100%**
- `ventes-orange-dirty.csv` — Fichier avec erreurs, **doit produire un rapport d'erreurs détaillé**

**Format** : CSV, séparateur `,`, encodage UTF-8, header inclus
**Format de date attendu** : `YYYY-MM-DD`

### Source 2 — Stock Banque Atlantique

- `source-stock-banque.json` — Schéma de la source
- `stock-banque-clean.csv` — Fichier propre
- `stock-banque-dirty.csv` — Fichier avec erreurs

**Format** : CSV, séparateur `;`, encodage UTF-8, header inclus
**Format de date attendu** : `DD/MM/YYYY` (format européen)

> ⚠️ Attention : les deux sources ont des **délimiteurs et formats de date différents**. C'est volontaire, ça reflète la réalité du métier de DataFlow CI.

## Ce qu'on attend de toi

1. **Charger les schémas** depuis les fichiers JSON pour créer les deux sources dans ton système
2. **Uploader les fichiers clean** → tous les enregistrements doivent être validés
3. **Uploader les fichiers dirty** → le système doit :
   - Détecter les erreurs ligne par ligne
   - Ne **pas** rejeter le fichier entier si certaines lignes sont valides
   - Produire un rapport clair qui aide l'utilisateur à corriger
   - Permettre de télécharger uniquement les lignes valides (cf. brief)

## Liberté laissée

- Tu peux **générer tes propres jeux de données** supplémentaires si tu veux tester plus de cas
- Tu peux **enrichir les schémas** avec d'autres règles si tu veux montrer ce que ton système peut faire
- Tu peux modifier les samples pour tes tests — mais garde les originaux pour la démo
