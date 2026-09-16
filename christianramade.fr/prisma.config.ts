import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// En production, les variables sont injectées par docker-compose (env_file),
// le fichier .env.production n'existe pas dans le conteneur. On ne charge le
// fichier que s'il existe, pour ne pas écraser les variables d'environnement.
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";

if (existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});