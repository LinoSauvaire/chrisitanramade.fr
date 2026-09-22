# Déploiement production — christianramade.fr

Ce document décrit l'installation et l'exploitation de l'application Next.js
sur le VPS KVM 1, derrière un reverse proxy nginx avec HTTPS automatique.

## Architecture

```
Internet ──► nginx (443/80) ──► Next.js (127.0.0.1:3000) ──► PostgreSQL (réseau Docker interne)
```

- **nginx** : reverse proxy, HTTPS (Let's Encrypt), redirection HTTP → HTTPS.
- **Next.js** : conteneur Docker `christianramade-app`, port interne 3000.
- **PostgreSQL** : conteneur Docker `christianramade-db`, **aucun port public**,
  accessible uniquement via le réseau Docker interne (service `db`).
- **S3** : stockage des images (bucket privé recommandé).

---

## 1. Variables d'environnement requises

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL interne au réseau Docker (`postgresql://USER:PASS@db:5432/DB`) |
| `POSTGRES_USER` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL (long et aléatoire) |
| `POSTGRES_DB` | Nom de la base |
| `S3_REGION` | Région AWS du bucket (ex : `eu-north-1`) |
| `S3_BUCKET_NAME` | Nom exact du bucket S3 |
| `S3_PUBLIC_ACCES_KEY` | Clé d'accès IAM (côté serveur uniquement) |
| `S3_SECRET_KEY` | Clé secrète IAM (côté serveur uniquement) |
| `CONFIG_PASSWORD` | Mot de passe de l'interface `/config` |
| `CONTACT_EMAIL` | Adresse recevant les messages de contact |
| `RESEND_API_KEY` | Clé API Resend (optionnelle) |
| `RESEND_FROM_EMAIL` | Expéditeur Resend |
| `NEWSLETTER_CRON_SECRET` | Secret protégeant la route cron newsletter |

> ⚠️ **`S3_PUBLIC_ACCES_KEY`** : ce nom contient une seule lettre `S` dans
> `ACCES` (pas `ACCESS`). Il est utilisé tel quel dans `app/_lib/S3Uploader.ts`
> et `app/api/s3/[key]/route.ts`. **Ne pas le renommer** sans modifier tous
> les appels concernés.

---

## 2bis. nginx : limite d'upload obligatoire (⚠️ CRITIQUE)

Le reverse proxy nginx a une limite de corps de requête **par défaut de 1 Mo**
(`client_max_body_size 1m`). Or l'application accepte des uploads allant jusqu'à
**200 Mo** (`serverActions.bodySizeLimit` dans `next.config.ts`).

**Symptôme** : en production, tout upload de photo échoue avec le message
« Erreur lors de l'upload. Photos trop lourdes ou problème réseau. » alors que
le même upload fonctionne en local (`next dev`, pas de nginx).

**Cause** : nginx renvoie `413 Request Entity Too Large` avant que la requête
n'atteigne Next.js.

**Correctif** : définir `client_max_body_size` ≥ la limite Next.js dans la
config nginx. Une config de référence est versionnée dans
`deploy/nginx/christianramade.conf.example`.

> ℹ️ **Next.js 16 ajoute une 2e limite** : `experimental.proxyClientMaxBodySize`
> (par défaut **10 Mo**). Le proxy interne de Next bufferise le corps de la
> requête ; au-delà de 10 Mo il tronque le corps. Pour les gros uploads, il est
> donc nécessaire de l'augmenter aussi (mis à `200mb` dans `next.config.ts`).
> Sans lui, l'action peut recevoir un corps tronqué et échouer malgré la limite
> `serverActions.bodySizeLimit` et nginx correctement configurés.

```nginx
# Dans un context http{} ou server{}
client_max_body_size 200m;
```

Sur le VPS :

```bash
sudo nano /etc/nginx/sites-available/christianramade.fr
# ajouter : client_max_body_size 200m; (dans server{} ou http{})
sudo nginx -t            # vérifie la syntaxe
sudo systemctl reload nginx
```

📌 Vérifiez que le reverse proxy pointe le bon port du conteneur.
Le `docker-compose.production.yml` publie le conteneur sur
`127.0.0.1:3004` (et non `3000`) — nginx doit donc utiliser
`proxy_pass http://127.0.0.1:3004;`.

---

## 2. Création du fichier `.env.production` (uniquement sur le VPS)

Ce fichier **ne doit jamais** être versionné ni envoyé sur GitHub.

```bash
mkdir -p /opt/christianramade
# Créez le fichier avec des permissions strictes :
touch /opt/christianramade/.env.production
chmod 600 /opt/christianramade/.env.production
```

Contenu minimal (remplacez les valeurs) :

```dotenv
NODE_ENV=production
PORT=3000

POSTGRES_USER=christian
POSTGRES_PASSWORD=<mot-de-passe-long-et-aleatoire>
POSTGRES_DB=christianramade

# Hôte `db` = service Docker interne (pas d'IP publique)
DATABASE_URL=postgresql://christian:<mot-de-passe>@db:5432/christianramade

S3_REGION=eu-north-1
S3_BUCKET_NAME=christianramade
S3_PUBLIC_ACCES_KEY=<cle-acces>
S3_SECRET_KEY=<cle-secrete>

CONFIG_PASSWORD=<mot-de-passe-admin>
CONTACT_EMAIL=contact@christianramade.fr
RESEND_API_KEY=<cle-resend>
RESEND_FROM_EMAIL=Christian <noreply@christianramade.fr>
NEWSLETTER_CRON_SECRET=<secret-aleatoire>
```

---

## 3. Lancement initial

```bash
# Clone du dépôt (dans un répertoire dédié)
git clone <URL_DU_DEPOT> /opt/christianramade/app
cd /opt/christianramade/app

# Copie du fichier d'environnement (déjà créé ci-dessus)
# Le Compose lit les variables depuis l'environnement du shell.
# Chargez le fichier avant chaque commande :
set -a; source /opt/christianramade/.env.production

# Construction et démarrage
docker compose -f docker-compose.production.yml up -d --build
```

Au premier démarrage, le conteneur `app` :
1. attend que PostgreSQL soit sain (`service_healthy`) ;
2. exécute `npm run migrate` (`prisma migrate deploy`, idempotent) ;
3. démarre `npm run start` (Next.js en production).

---

## 4. Vérification des logs

```bash
docker logs -f christianramade-app
docker logs -f christianramade-db
```

Vérifiez que :
- les migrations se sont appliquées sans erreur ;
- Next.js écoute sur le port 3000 ;
- aucune variable secrète n'apparaît dans les logs.

---

## 5. Mise à jour depuis `main`

```bash
cd /opt/christianramade/app
git pull origin main

# Sauvegarde avant mise à jour (voir section 8)
# Reconstruit et redémarre
docker compose -f docker-compose.production.yml up -d --build
```

Les migrations sont appliquées automatiquement au démarrage du conteneur.

---

## 6. Rollback vers un commit précédent

```bash
cd /opt/christianramade/app
git log --oneline -5          # repérer le commit précédent
git checkout <commit_precedent>

docker compose -f docker-compose.production.yml up -d --build
```

> ⚠️ Si le rollback implique une migration de schéma déjà appliquée,
> restaurez d'abord la sauvegarde PostgreSQL (voir section 8).

---

## 7. Sauvegarde et restauration PostgreSQL

### Sauvegarde (quotidienne recommandée)

```bash
# Depuis le VPS
docker exec christianramade-db pg_dump -U christian christianramade \
  > /backups/christianramade-$(date +%F).sql
```

### Restauration

```bash
docker exec -i christianramade-db psql -U christian -d christianramade \
  < /backups/christianramade-YYYY-MM-DD.sql
```

---

## 8. Renouvellement HTTPS

Si vous utilisez nginx + Let's Encrypt (certbot), le renouvellement est
automatique. Vérifiez périodiquement :

```bash
certbot renew
```

---

## 9. Scripts d'administration (migrations de données, etc.)

Les scripts qui accèdent à la base (ex. `npm run migrate:photos`) doivent
être exécutés **à l'intérieur du conteneur** `christianramade-app`, car
PostgreSQL n'est accessible que via le réseau Docker interne (hôte `db`).
Les lancer directement sur le VPS échoue avec `ECONNREFUSED`.

```bash
# Depuis le VPS — exécute le script dans le conteneur (DATABASE_URL y est défini)
docker exec -it christianramade-app npm run migrate:photos
```

> ⚠️ Ne pas lancer `npm run migrate:photos` directement dans le shell du VPS :
> l'hôte `db` n'y est pas résolvable et `DATABASE_URL` n'y est pas défini.

---

## 10. Procédure de diagnostic

- **Le conteneur app ne démarre pas** : consultez les logs
  (`docker logs christianramade-app`). Vérifiez que `DATABASE_URL` pointe
  vers `db` (réseau interne) et que PostgreSQL est sain.
- **L'upload de photo échoue en prod** (mais fonctionne en local) : presque
  toujours la limite `client_max_body_size` de nginx (1 Mo par défaut) bloquant
  la requête en `413`. Voir section 2bis.
- **Images S3 non affichées** : vérifiez `S3_REGION`, `S3_BUCKET_NAME` et
  les permissions IAM. Si le bucket est privé, les URLs publiques ne
  fonctionneront pas — utilisez des URLs signées.
- **Erreur de connexion DB** : vérifiez que le mot de passe dans
  `.env.production` correspond à `POSTGRES_PASSWORD`.
- **Port 3000 inaccessible** : le reverse proxy doit pointer vers
  `127.0.0.1:3000` (le port n'est pas exposé publiquement).

---

## 11. Sécurité obligatoire

1. Remplacer les identifiants PostgreSQL visibles dans l'historique Git.
2. Révoquer et régénérer les clés S3 si elles ont été commitées.
3. Ne pas exposer le port PostgreSQL sur Internet.
4. Pare-feu : autoriser uniquement SSH, HTTP, HTTPS.
5. Utiliser une clé SSH (pas de mot de passe) pour l'administration.
6. Désactiver le SSH root par mot de passe.
7. Permissions `600` sur `.env.production`.
8. Activer les sauvegardes du volume PostgreSQL.
9. Vérifier les limites d'upload et les types MIME acceptés.
10. Vérifier l'authentification des routes d'administration.
11. Ne jamais exposer Prisma Studio publiquement.
12. Logs sans secrets, avec rotation.

---

## 11. Tests après le clone (avant publication)

```bash
npm ci
npx prisma generate
npm run lint
npm run build
```

Puis testez localement : page d'accueil, galeries, journal, profil,
formulaire newsletter, upload/suppression d'image, routes API, mobile,
HTTPS/redirection, redémarrage après reboot, sauvegarde/restauration.