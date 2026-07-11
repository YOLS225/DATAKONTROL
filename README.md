# DataKontrol

DataKontrol est une plateforme de validation et de controle de donnees. Elle permet de declarer des sources, de versionner leurs schemas, d'uploader des fichiers CSV/Excel, puis de suivre les erreurs de validation ligne par ligne.

Le projet est organise en deux applications:

- `backend`: API NestJS avec PostgreSQL, Prisma, Redis/BullMQ et MinIO.
- `frontend`: interface Next.js pour piloter les sources, schemas, uploads, rapports et statistiques.

Le dossier `data` contient des jeux de donnees de demonstration pour tester le parcours complet.

Application deployee: `https://datakontrol.vercel.app`

## Fonctionnalites

- Authentification par email/mot de passe avec access token et refresh token.
- Gestion des sources de donnees par utilisateur.
- Creation, modification, publication et historisation de versions de schema.
- Upload de fichiers `.csv`, `.xls` et `.xlsx` jusqu'a 10 Mo.
- Validation asynchrone des fichiers via BullMQ.
- Stockage des fichiers originaux dans MinIO.
- Suivi des statuts d'upload: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.
- Consultation paginee des erreurs de validation.
- Dashboard de statistiques.

## Stack technique

### Backend

- Node.js
- NestJS
- Prisma
- PostgreSQL
- Redis + BullMQ
- MinIO compatible S3
- Swagger

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- Zustand
- Radix UI
- Lucide React

## Structure du projet

```text
.
├── backend/        # API NestJS, Prisma, workers et configuration Docker
├── frontend/       # Application Next.js
├── data/           # Schemas et fichiers CSV de test
├── DESIGN.md       # Notes de design, actuellement vide
└── README.md
```

## Prerequis

- Node.js 20 ou plus recent
- npm
- Docker et Docker Compose

## Demarrage rapide avec Docker

Le backend fournit un `compose.yaml` qui lance l'API et ses dependances: PostgreSQL, Redis et MinIO.

```bash
cd backend
npm install
docker compose -f compose.yaml -p validation-platform up -d --build
```

L'API est ensuite disponible sur:

- Backend: `http://localhost:9000`
- Swagger: `http://localhost:9000/api`
- Healthcheck: `http://localhost:9000/api/health`
- PostgreSQL local: `localhost:5469`
- Redis local: `localhost:6379`
- MinIO API: `http://localhost:9001`
- MinIO Console: `http://localhost:9002`

Identifiants MinIO par defaut:

```text
minioadmin / minioadmin
```

Le `Dockerfile` applique les migrations Prisma au demarrage du conteneur backend avec `prisma migrate deploy`.

## Demarrage en local

### 1. Lancer les dependances

Pour developper hors conteneur, lance d'abord PostgreSQL, Redis et MinIO avec Docker:

```bash
cd backend
docker compose -f compose.yaml -p validation-platform up -d postgres redis minio
```

### 2. Configurer le backend

Le fichier `backend/.env` contient deja une configuration de developpement. Les variables principales sont:

```env
NODE_ENV=development
PORT=9000
DATABASE_URL=postgresql://postgres:postgres@localhost:5469/postgres?schema=public
JWT_SECRET=change-me
REDIS_HOST=localhost
REDIS_PORT=6379
S3_ENDPOINT=http://localhost:9001
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=validation-files
S3_FORCE_PATH_STYLE=true
```

Attention: dans le `compose.yaml`, le backend conteneurise utilise les noms de services Docker (`redis`, `minio`, `postgres`). Pour un backend lance directement avec `npm run start:dev`, utilise les hostnames locaux (`localhost`) comme ci-dessus.

Installe les dependances, genere le client Prisma et applique les migrations:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

### 3. Configurer le frontend

Cree `frontend/.env.local` a partir de `frontend/.env.example`, puis pointe l'interface vers l'API backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api
```

Demarre ensuite l'application:

```bash
cd frontend
npm install
npm run dev
```

Le frontend est disponible par defaut sur `http://localhost:3000`.

## Commandes utiles

### Backend

```bash
cd backend
npm run start:dev        # API en mode watch
npm run build            # build NestJS
npm run test             # tests unitaires
npm run test:e2e         # tests end-to-end
npm run prisma:generate  # generation du client Prisma
npm run prisma:migrate   # migration Prisma en developpement
npm run prisma:studio    # interface Prisma Studio
```

Le backend expose aussi un `Makefile`:

```bash
cd backend
make build    # build et demarre les services Docker
make up       # demarre les services Docker
make down     # arrete les services Docker
make restart  # redemarre les services Docker
make clean    # supprime conteneurs et volumes
make reset    # clean + build
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run start
npm run lint
```

## API principale

Toutes les routes backend sont prefixees par `/api`.

### Authentification

| Methode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Cree un utilisateur |
| `POST` | `/api/auth/login` | Authentifie un utilisateur |
| `POST` | `/api/auth/refresh` | Renouvelle les tokens |
| `POST` | `/api/auth/logout` | Invalide un refresh token |

Les routes metier utilisent `Authorization: Bearer <accessToken>`.

### Sources

| Methode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/source` | Cree une source |
| `GET` | `/api/source` | Liste les sources de l'utilisateur |
| `GET` | `/api/source/:id` | Recupere une source |
| `PATCH` | `/api/source/:id` | Modifie une source |
| `DELETE` | `/api/source/:id` | Supprime une source non liee |

La liste accepte `page`, `page_size` et `search`.

### Versions de schema

| Methode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/source/:sourceId/schema-versions` | Cree un brouillon de schema |
| `GET` | `/api/source/:sourceId/schema-versions` | Liste les versions |
| `GET` | `/api/source/:sourceId/schema-versions/:id` | Recupere une version |
| `PATCH` | `/api/source/:sourceId/schema-versions/:id` | Modifie un brouillon |
| `POST` | `/api/source/:sourceId/schema-versions/:id/publish` | Publie une version |
| `POST` | `/api/source/:sourceId/schema-versions/:id/duplicate` | Duplique une version en brouillon |
| `DELETE` | `/api/source/:sourceId/schema-versions/:id` | Supprime un brouillon non publie |

Types de colonnes supportes:

```text
string, integer, decimal, boolean, date, datetime
```

Exemple de definition de schema:

```json
{
  "schemaDefinition": {
    "columns": [
      {
        "id": "customer-email",
        "name": "email",
        "type": "string",
        "required": true
      }
    ]
  }
}
```

### Uploads et rapports

| Methode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/source/:sourceId/uploads` | Upload un fichier CSV/XLS/XLSX |
| `GET` | `/api/source/:sourceId/uploads` | Liste les uploads d'une source |
| `GET` | `/api/source/:sourceId/uploads/:id` | Recupere un upload et son statut |
| `GET` | `/api/source/:sourceId/uploads/:id/file` | Lit le fichier original |
| `GET` | `/api/source/:sourceId/uploads/:id/errors` | Liste les erreurs de validation |
| `GET` | `/api/source/:sourceId/uploads/:id/valid-rows` | Telecharge les lignes valides en CSV |

L'upload se fait en `multipart/form-data` avec un champ `file`.

### Dashboard

| Methode | Route | Description |
| --- | --- | --- |
| `GET` | `/api/dashboard/stats` | Recupere les statistiques du dashboard |

## Donnees de test

Le dossier `data` contient deux sources de demonstration:

- `source-ventes-orange.json`
- `source-stock-banque.json`

Chaque source possede un fichier propre et un fichier avec erreurs:

- `ventes-orange-clean.csv`
- `ventes-orange-dirty.csv`
- `stock-banque-clean.csv`
- `stock-banque-dirty.csv`

Parcours de test recommande:

1. Creer un compte via l'interface ou `/api/auth/register`.
2. Creer une source.
3. Creer une version de schema avec le JSON correspondant dans `data`.
4. Publier la version de schema.
5. Uploader le fichier `*-clean.csv`, qui doit etre valide.
6. Uploader le fichier `*-dirty.csv`, qui doit produire des erreurs detaillees.
7. Consulter le statut de l'upload et la liste des erreurs.

## Notes d'exploitation

- Les migrations Prisma sont stockees dans `backend/prisma/migrations`.
- Les fichiers uploades sont stockes dans MinIO, bucket `validation-files`.
- Les validations sont traitees par le worker BullMQ embarque dans le backend.
- La concurrence du worker peut etre ajustee avec `UPLOAD_WORKER_CONCURRENCY`.
- En production, configure `FRONTEND_URL` pour restreindre les origines CORS.
- Remplace toujours `JWT_SECRET=change-me` hors developpement local.

## Depannage

### Le backend local ne se connecte pas a Redis ou MinIO

Verifie que `REDIS_HOST` et `S3_ENDPOINT` utilisent `localhost` si le backend tourne avec `npm run start:dev`. Les valeurs `redis` et `minio` ne fonctionnent que depuis le reseau Docker Compose.

### Le frontend appelle la mauvaise API

Verifie `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api
```

Redemarre ensuite `npm run dev`.

### Les migrations Prisma echouent

Verifie que PostgreSQL est lance et accessible sur `localhost:5469`, puis relance:

```bash
cd backend
npm run prisma:migrate
```

### L'upload reste en attente

Verifie que Redis est disponible et que le backend est bien lance. Le worker BullMQ est initialise au demarrage de l'application NestJS.
