/**
 * Prisma seed — restaure un dump pg_dump (plain SQL) dans la base.
 *
 * Usage :
 *   npx prisma db seed
 *
 * Le dump attendu est un dump "plain SQL" généré par `pg_dump` (avec des blocs
 * `COPY ... FROM stdin`), compressé en gzip. Il est lu depuis
 * `prisma/dump/christianramade-db-2026-09-16.sql.gz`.
 *
 * Le script :
 *   1. Décompresse le dump gzip.
 *   2. Exécute les instructions SQL (CREATE TABLE, contraintes, index, ...).
 *   3. Restaure les données des blocs `COPY ... FROM stdin` via pg-copy-streams.
 *
 * Il est idempotent : il droppe d'abord les tables existantes (DROP TABLE ...
 * CASCADE) avant de recharger le schéma et les données, ce qui permet de
 * relancer le seed sans erreur.
 */
import "dotenv/config";
import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Client } from "pg";
import { from as copyFrom } from "pg-copy-streams";

const DUMP_PATH = "prisma/dump/christianramade-db-2026-09-16.sql.gz";

// Tables présentes dans le dump, dans l'ordre de dépendance (parents d'abord)
// pour que les DROP TABLE ... CASCADE fonctionnent proprement.
const TABLES = [
  "profiles",
  "homepages",
  "tickets",
  "series",
  "photos",
  "featured_works",
  "timeline_items",
  "books",
  "subscribers",
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL est manquant. Vérifiez votre fichier .env (ou .env.production).",
    );
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log(`→ Lecture du dump : ${DUMP_PATH}`);
    const gunzip = createGunzip();
    const source = createReadStream(DUMP_PATH).pipe(gunzip);

    // Lit tout le dump décompressé en mémoire (~100 Ko, négligeable).
    const chunks: Buffer[] = [];
    for await (const chunk of source) {
      chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString("utf-8");
    const lines = text.split("\n");

    // Vide les tables existantes avant de recharger (idempotence).
    // Le dump contient le schéma complet (CREATE TABLE, contraintes, index),
    // donc on droppe les tables existantes pour éviter les conflits.
    console.log("→ Nettoyage des tables existantes…");
    await client.query(
      `DROP TABLE IF EXISTS ${TABLES.join(", ")} CASCADE`,
    );
    await client.query(`DROP TABLE IF EXISTS _prisma_migrations CASCADE`);

    console.log("→ Restauration du schéma et des données…");

    let sqlBuffer = "";
    let i = 0;

    const flushSql = async () => {
      const trimmed = sqlBuffer.trim();
      sqlBuffer = "";
      if (!trimmed) return;
      await client.query(trimmed);
    };

    while (i < lines.length) {
      const line = lines[i];

      // Ignore les méta-commandes psql (\restrict, \unrestrict, ...).
      if (line.startsWith("\\")) {
        i++;
        continue;
      }

      // Début d'un bloc COPY ... FROM stdin;
      if (line.startsWith("COPY public.") && line.includes("FROM stdin;")) {
        await flushSql();

        const m = line.match(/^COPY public\.(\w+)\s/);
        const table = m ? m[1] : null;

        // Collecte les lignes de données jusqu'au terminateur "\."
        const dataLines: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim() !== "\\.") {
          dataLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // consomme la ligne "\."

        if (table) {
          await restoreCopy(client, table, dataLines);
        }
        continue;
      }

      // Accumule les instructions SQL jusqu'au point-virgule final.
      sqlBuffer += line + "\n";
      if (line.trimEnd().endsWith(";")) {
        await flushSql();
      }
      i++;
    }

    await flushSql();

    console.log("✅ Seed terminé avec succès.");
  } finally {
    await client.end();
  }
}

/**
 * Restaure un bloc COPY pour une table donnée via pg-copy-streams.
 * On envoie uniquement les lignes de données (format texte COPY : colonnes
 * séparées par tabulations, `\N` pour NULL) suivies du terminateur `\.`.
 * L'en-tête `COPY ... FROM stdin;` est géré par la commande COPY elle-même.
 */
async function restoreCopy(client: Client, table: string, dataLines: string[]) {
  const body = dataLines.join("\n") + (dataLines.length ? "\n" : "") + "\\.\n";

  const copyStream = client.query(copyFrom(`COPY public.${table} FROM STDIN`));
  const source = Readable.from([body]);
  await pipeline(source, copyStream);
  console.log(`   ✓ ${table} (${dataLines.length} lignes)`);
}

main().catch((err) => {
  console.error("❌ Erreur lors du seed :", err);
  process.exit(1);
});
