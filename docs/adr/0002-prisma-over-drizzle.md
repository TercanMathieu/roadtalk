# ADR-002 — Prisma comme ORM, au lieu de Drizzle

## Contexte

La stack initiale du projet excluait explicitement Prisma pour une raison précise :
support PostGIS insuffisant pour un produit géospatial (`Ride`/`Route` auront besoin
de colonnes géométriques et de requêtes spatiales — `ST_DWithin`, `ST_Distance`, etc.).
Drizzle a été choisi à la place, et le module `User` a été construit dessus en premier
(schéma, migration, repository, tests d'intégration Testcontainers).

Cette décision a ensuite été reconsidérée deux fois dans la même session :

1. **Retour vers Prisma** proposé, sans nouvelle raison technique. Refusé sur le
   moment : la limitation PostGIS documentée depuis le début du projet n'avait pas
   changé, et le module `User` fonctionnait déjà sur Drizzle.
2. **MikroORM** proposé comme alternative. Avant de réécrire quoi que ce soit, une
   vérification réelle a été faite (pas une supposition) : un article d'évaluation
   comparative des ORM TypeScript pour PostGIS conclut que MikroORM est **non viable**
   pour cet usage — sa méthode `.where()` n'accepte qu'un objet, ce qui empêche
   d'injecter des fonctions spatiales. Une issue GitHub sur le repo MikroORM corrobore
   ça concrètement (erreur `parse error - invalid geometry` dès qu'on utilise les
   placeholders paramétrés pour une requête `ST_DWithin`, avec pour seul contournement
   documenté l'interpolation directe des coordonnées dans la chaîne SQL — ce qui
   réintroduit un risque d'injection).
3. Le même article positionne **Prisma** comme option "correcte mais limitée" : les
   requêtes PostGIS y passent uniquement par `$queryRaw`/`$executeRaw`, sans
   composition avec le reste du query builder — un vrai compromis, mais un compromis
   documenté et contournable, contrairement à MikroORM.

**Décision finale du porteur du projet** : basculer sur Prisma malgré cette limitation
connue, en connaissance de cause.

## Décision

Le module `User` est réécrit sur **Prisma** :

- `prisma/schema.prisma` définit le modèle `User` (colonnes `id` en `uuid` natif
  Postgres, `created_at` en `timestamptz` — pas les types par défaut de Prisma qui
  auraient silencieusement dégradé la précision par rapport à ce qu'on avait avec
  Drizzle).
- `PrismaService` (`src/infrastructure/database/prisma.service.ts`) étend
  `PrismaClient` et gère le cycle de connexion via les hooks `OnModuleInit`/
  `OnModuleDestroy` de NestJS — c'est le pattern d'intégration officiellement
  documenté par Prisma pour NestJS.
- Les migrations vivent dans `prisma/migrations/`, générées et appliquées via
  `prisma migrate dev` (workflow local) — pas de script maison comme avec Drizzle,
  Prisma gère ça nativement.
- Pour les tests d'intégration Testcontainers, `prisma db push` (pas
  `migrate deploy`) synchronise le schéma sur la base éphémère — plus rapide, pas
  besoin de rejouer l'historique de migration sur une base qui n'existera que le
  temps du test.

**Conséquence assumée pour la suite** : quand `Route` aura besoin de colonnes
géométriques (session 7+), ces colonnes et leurs requêtes passeront par
`Prisma.$queryRaw`/`$executeRaw` avec du SQL PostGIS explicite, en dehors du modèle
Prisma habituel. Ce n'est pas un problème caché — c'est écrit ici pour que la
prochaine session sur `Route` ne redécouvre pas la limitation à ce moment-là.

## Conséquences

- Le module `User` a été entièrement réécrit une seconde fois dans la même session
  (schéma, repository, service, module, test d'intégration) — coût réel payé pour
  ce changement de direction.
- Les tests d'intégration sont plus lents qu'avec Drizzle (~9-13s contre ~6-10s) :
  `prisma db push` lance un sous-processus CLI à chaque exécution, alors que le
  migrateur programmatique de Drizzle tournait en mémoire dans le process de test.
- `Prisma.PrismaClientKnownRequestError` (code `P2025`) doit être explicitement
  attrapé dans le repository pour les opérations `update`/`delete` sur une ligne
  inexistante — contrairement à Drizzle où `.returning()` renvoyait simplement un
  tableau vide. Fait dans `users.repository.ts`.
- Développement futur sur `Route`/`Ride` avec colonnes géométriques : prévoir du SQL
  brut pour cette partie précise, le reste du modèle reste du Prisma classique.

## Alternatives écartées

- **MikroORM** — non viable pour PostGIS, confirmé par une source indépendante et une
  issue GitHub corroborante (voir Contexte). Écarté avant toute réécriture, pas après.
- **Rester sur Drizzle** — objectivement la meilleure option pour PostGIS parmi les
  trois évaluées (SQL-first, requêtes spatiales composables nativement). Écarté malgré
  ça : choix assumé du porteur du projet en faveur de l'écosystème/outillage Prisma,
  la limitation PostGIS étant jugée acceptable via `$queryRaw`.
