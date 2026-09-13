# ─────────────────────────────────────────────────────────────
# Dockerfile multi-stage — christianramade.fr (Next.js 16)
# Aucun secret n'est embarqué dans l'image. Toutes les variables
# d'environnement sont injectées au moment de l'exécution.
# ─────────────────────────────────────────────────────────────

# ── Étape 1 : installation des dépendances ────────────────────
FROM node:20-alpine AS base

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances uniquement (cache npm efficace)
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Installe les dépendances de production
RUN npm install --no-save --no-progress

# ── Étape 2 : génération du client Prisma ────────────────────
FROM base AS prisma
# Le client Prisma est généré à partir du schéma versionné.
RUN npx prisma generate

# ── Étape 3 : construction de l'application ───────────────────
FROM prisma AS build

# Copie le code source (hors fichiers ignorés par .dockerignore)
COPY . .

# Construit Next.js en mode production
RUN npm run build

# ── Étape 4 : image d'exécution ───────────────────────────────
FROM node:20-alpine AS run

WORKDIR /app

# Active le mode production (désactive le chargement de dotenv côté dev)
ENV NODE_ENV=production

# Copie uniquement le build et les fichiers nécessaires à l'exécution
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
# Client Prisma généré (nécessaire aux scripts tsx comme migrate:photos)
COPY --from=build /app/app/generated ./app/generated
# Modules partagés utilisés par les scripts d'administration (prisma, S3, sharp)
COPY --from=build /app/app/_lib ./app/_lib
# Scripts d'administration (migrate:photos, etc.)
COPY --from=build /app/scripts ./scripts

# Utilisateur non-root pour l'exécution
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Port interne uniquement (jamais exposé directement sur Internet)
ENV PORT=3000
EXPOSE 3000

# Démarre l'application : applique les migrations versionnées (idempotent),
# puis lance Next.js en production.
CMD ["sh", "-c", "npm run migrate && npm run start"]