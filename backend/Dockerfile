# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma 7 charge prisma.config.ts pendant `prisma generate` et exige
# DATABASE_URL, meme si la generation du client ne se connecte pas a la DB.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

COPY . .

# On n'utilise pas "npm run build" car il inclut "prisma migrate deploy" (nécessite la DB)
# Les migrations sont appliquées au démarrage du container
RUN npx prisma generate && npx nest build

# ── Stage 2: production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

COPY prisma.config.ts ./
COPY --from=builder /app/dist ./dist

EXPOSE 9000

# Applique les migrations puis démarre l'app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
