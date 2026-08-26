# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Le projet

RoadTalk — application mobile de navigation moto (V1 : navigation autonome ; suivi de
groupe temps réel, voix et communauté viendront en V2/V3, hors périmètre actuel).
Monorepo pnpm/Turborepo, développeur solo, budget infra < 100 €/mois → auto-hébergement
systématique, aucun service managé sans justification concrète.

Les décisions structurantes sont documentées dans `docs/adr/` — les lire avant de
remettre en cause un choix qui y est tracé :

- **ADR-001** : frontières hexagonales par contexte (`domain/application/infrastructure/presentation`
  pour Ride/Route/Navigation ; simple service+repository pour Auth/Profile/Media).
- **ADR-002** : Prisma comme ORM (pas Drizzle, pas MikroORM) — inclut une limitation
  PostGIS connue et acceptée, avec la conséquence concrète pour les futures colonnes
  géométriques de `Route`.

## Commandes

Depuis la racine (via Turborepo, tourne sur tous les packages du workspace) :

```bash
pnpm install                # installe tout, régénère le client Prisma (postinstall)
pnpm dev                    # turbo run dev — API + mobile en parallèle
pnpm lint                   # turbo run lint
pnpm typecheck              # turbo run typecheck
pnpm test                   # turbo run test
pnpm build                  # turbo run build
```

Cibler un seul package : `pnpm --filter @roadtalk/api <script>` (ou `cd apps/api && pnpm <script>`).
Packages : `@roadtalk/api`, `@roadtalk/mobile`, `@roadtalk/contracts`, `@roadtalk/domain-shared`, `@roadtalk/config`.

Lancer un seul fichier de test :

```bash
cd apps/api && pnpm exec vitest run test/modules/users/users.service.integration.spec.ts
```

Base de données locale (Postgres+PostGIS, Redis) :

```bash
docker compose -f infra/docker/docker-compose.yml up -d
cd apps/api && pnpm db:migrate      # prisma migrate dev
cd apps/api && pnpm db:generate     # prisma generate (après modif de prisma/schema.prisma)
```

Variables d'environnement de l'API : voir `apps/api/.env.example` (commentaires inclus,
notamment comment générer la paire de clés EdDSA pour `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`).
`GOOGLE_OAUTH_CLIENT_ID`/`APPLE_CLIENT_ID` peuvent rester vides en dev — le provider
correspondant échoue alors avec `AUTH_PROVIDER_NOT_CONFIGURED` plutôt qu'une erreur
opaque, sans bloquer le démarrage du serveur.

Mobile — deux modes selon ce qui est modifié :

```bash
cd apps/mobile && pnpm exec expo start           # Expo Go — tant qu'aucun module natif custom (MapLibre) n'est ajouté
cd apps/mobile && pnpm dev                       # --dev-client — nécessaire dès qu'un module natif existe (voir eas.json)
```

## Architecture

### Monorepo

```
apps/api/         NestJS + Fastify (backend)
apps/mobile/       Expo Router (React Native)
packages/contracts/       Schémas Zod partagés API ↔ mobile — source de vérité des DTO
packages/domain-shared/   Primitives partagées : Brand<T,B>, unités SI, IDs nominaux, Result<T,E>
packages/config/          tsconfig / eslint / prettier communs
infra/docker/              docker-compose (Postgres+PostGIS, Redis)
docs/adr/                  Architecture Decision Records
```

`packages/domain-shared` et `packages/contracts` n'ont pas d'étape de build (`main`
pointe directement sur `src/index.ts`, résolu tel quel par `ts-node`/`vitest`/`tsc`).
Ça fonctionne tant que rien n'est déployé — à revisiter quand un vrai build de
production sera nécessaire.

### Backend (`apps/api`)

Frontières en couches strictement appliquées pour **Ride, Route, Navigation** (ADR-001) :

```
src/modules/<context>/
  domain/           TypeScript pur — aucun import NestJS, Prisma, HTTP
  application/       cas d'usage, orchestre le domaine
  infrastructure/    adaptateurs concrets
  presentation/       controllers, DTO
```

Règle de dépendance vérifiée en CI par deux mécanismes dans `apps/api/eslint.config.js` :
`eslint-plugin-boundaries` (une couche ne peut importer que vers l'intérieur) et
`no-restricted-imports` scoping sur `src/modules/*/domain/**` (interdit `@nestjs/*`,
`fastify`, tout ORM). Le domaine modélise ses invariants en unions discriminées (ex.
`Ride` a un statut `planned|active|completed|cancelled`, un `CompletedRide` a toujours
un `summary` — état illégal irreprésentable) et retourne `Result<T, E>` pour les erreurs
attendues plutôt que de lever des exceptions.

Pour **Auth, Profile, Media, User** — pas de logique métier significative — pas de
couches hexagonales (voir `modules/users/`). Le repository a même été jugé superflu
pour `User` spécifiquement : Prisma Client est déjà une couche d'accès aux données
propre et typée, donc `UsersService` appelle `PrismaService` directement plutôt que de
passer par un repository qui ne ferait que déléguer sans rien cacher de plus. Ce n'est
pas une règle générale — si un futur module CRUD a des requêtes assez complexes pour
que les isoler soit utile (ou pour garder le test Testcontainers ciblé sur l'accès aux
données seul), le repository redevient justifié. Ce module utilise `AppException`
(voir plus bas), pas `Result<T,E>` : c'est la distinction volontaire entre les deux
styles.

Persistance : Prisma (`prisma/schema.prisma`), `PrismaService` étend `PrismaClient`
avec les hooks `OnModuleInit`/`OnModuleDestroy`. `Prisma.PrismaClientKnownRequestError`
(code `P2025`) doit être explicitement attrapée pour `update`/`delete` sur une ligne
absente et traduite en `AppException(ErrorCode.USER_NOT_FOUND)` — Prisma lève une
exception là où on pourrait attendre un retour vide.

Validation : `ZodValidationPipe` (entrée, body) et `ZodResponseInterceptor` (sortie,
réponse) dans `src/infrastructure/http/` — génériques, réutilisables sur n'importe quel
schéma Zod des `packages/contracts`. Une réponse non conforme au contrat est un bug
serveur (500), une entrée non conforme est une erreur client (400) — distinction
volontaire, pas une erreur.

Auth (`src/modules/auth/` + `src/infrastructure/auth/`) : OAuth Apple/Google (`jose`,
JWKS distant mis en cache par instance via `createRemoteJWKSet`, jamais recréé par
appel) → JWT d'accès EdDSA (Ed25519, 15 min, `AccessTokenService`) + refresh token
opaque rotatif (30 jours, haché SHA-256 en base, jamais stocké en clair). Chaque
`refresh` invalide l'ancien token et en émet un nouveau ; réutiliser un refresh token
déjà révoqué est traité comme un vol et révoque toutes les sessions actives du user
(`AuthService.refresh`). Le module est coupé en deux pour éviter un cycle : `modules/auth`
gère *comment on obtient un token* (dépend de `UsersService`) ; `infrastructure/auth`
(`AccessTokenService`, `JwtAuthGuard`, `@CurrentUserId()`) est le mécanisme générique
*vérifier un token / savoir qui appelle*, sans dépendre de `modules/auth` — n'importe
quel module avec des routes protégées (`UsersModule` aujourd'hui) l'importe directement.
`DatabaseModule` exporte un `PrismaService` unique partagé entre `AuthModule` et
`UsersModule` pour éviter deux pools de connexions distincts.

Erreurs : chaque erreur envoyée au client suit `{ statusCode, code, message, details? }`.
`ErrorCode` (`packages/contracts/src/error-codes.ts`) est le vocabulaire partagé
mobile/API — le mobile doit brancher sa logique sur `code`, jamais parser `message`
(texte FR, affichable mais pas stable). `ERROR_CATALOG`
(`src/infrastructure/errors/error-catalog.ts`) associe chaque code à un statut HTTP et
un message par défaut — `Record<ErrorCode, ...>` exhaustif, la compilation échoue si un
code est oublié. Lever `AppException(code, message?, details?)` plutôt que les
exceptions NestJS génériques dès qu'un code existe pour le cas. `HttpExceptionFilter`
(global, `main.ts`) est le filet de sécurité : garantit qu'*aucune* réponse d'erreur ne
sort sans `code` exploitable, même une exception Nest/Fastify interne (route inconnue →
`INTERNAL_ERROR`) ou un bug totalement imprévu (loggé côté serveur, jamais de stack
trace exposée au client).

**Piège connu** : `tsx`/esbuild n'émet pas la métadonnée `design:paramtypes` dont
NestJS a besoin pour l'injection de dépendances par constructeur (limitation connue
d'esbuild) — l'injection échoue silencieusement (`undefined`, pas d'erreur claire). Le
script `dev` utilise `ts-node --transpile-only` pour cette raison ; ne pas revenir à
`tsx`/esbuild pour exécuter du code NestJS avec DI.

**Fichiers `vitest.config.mts`** (pas `.ts`) : sous `"module": "NodeNext"`, un fichier
`.ts` important `vitest/config` (paquet ESM-only) casse la compilation (TS1479). Suivre
ce nom de fichier pour tout nouveau package.

### Mobile (`apps/mobile`)

Expo Router (`app/` = routes, fines, délèguent à `src/features/*` à mesure qu'elles sont
créées). `src/ui/` = design system (tokens `colors`/`typography`/`spacing` + primitives
`Text`/`Button`) — toute nouvelle UI doit les réutiliser plutôt que styliser en dur.
Palette sombre uniquement pour l'instant ; le mode jour haute luminosité (contrainte
métier, voir plus bas) n'est pas construit.

Convention stricte : chaque écran/composant a son fichier `*.styles.ts` colocalisé
(`index.tsx` + `index.styles.ts`) — jamais de `StyleSheet.create` inline dans le
composant.

`expo-dev-client` n'est **pas** dans les dépendances tant qu'aucun module natif custom
n'est ajouté (MapLibre arrivera avec la carte) — sa présence seule fait qu'Expo Go
refuse de charger le projet. Le re-ajouter au même moment que le premier module natif,
pas avant.

## Stack

Implémenté : NestJS + Fastify, Prisma + PostgreSQL/PostGIS (Docker), Zod (validation +
contrats partagés), Expo Router + React Native, pnpm workspaces + Turborepo, Vitest +
Testcontainers (vraie Postgres pour l'intégration, jamais de mock d'infra), ESLint
(`typescript-eslint` strict-type-checked + `eslint-plugin-boundaries`) + Prettier.

Décidé mais pas encore construit (ne pas improviser autre chose quand ces sessions
arrivent) : Redis + BullMQ (jobs), Valhalla auto-hébergé (routing/map-matching), Photon
auto-hébergé (géocodage), S3-compatible/R2 (médias), OAuth Apple/Google → JWT EdDSA +
refresh token opaque rotatif (pas de mot de passe), MapLibre GL Native + tuiles MapTiler,
EAS Build, Sentry + OpenTelemetry → Grafana Cloud.

Explicitement écarté, avec raison : Google Maps SDK/Directions (coût + CGU), Mapbox
(facturation MAU imprévisible), Auth0/Clerk (coût + dépendance sur la donnée la plus
sensible), Kubernetes (aucun bénéfice avant ~100k utilisateurs), MikroORM et — pour
l'instant — Drizzle (voir ADR-002).

## Conventions et règles de code

- TypeScript strict partout (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noPropertyAccessFromIndexSignature` — voir `packages/config/tsconfig.base.json`).
  `exactOptionalPropertyTypes` distingue une clé absente d'une clé valant `undefined` :
  ne jamais assigner explicitement `undefined` à une propriété optionnelle, construire
  l'objet en n'incluant la clé que si elle est réellement fournie.
- `any` interdit. `unknown` + validation Zod pour toute donnée externe (réseau, disque,
  capteurs). Pas de `as` sur ces données — sauf dans les constructeurs de types
  nominaux (`meters()`, `toUserId()`, etc., dans `packages/domain-shared`), qui sont le
  seul point sanctionné pour ce cast, appelés seulement après validation en amont
  (Zod, `ParseUUIDPipe`...).
- Types nominaux pour identifiants et unités physiques via `Brand<T, B>`
  (`packages/domain-shared/src/brand.ts`). Toute valeur physique porte son unité SI
  dans son nom (`speedMps`, `distanceMeters`, jamais de valeur physique nue) — la
  conversion en unités d'affichage n'existe que dans la couche présentation.
- `Result<T, E>` pour les erreurs attendues dans le domaine (Ride/Route/Navigation) ;
  `AppException` (voir Backend ci-dessus) pour les modules CRUD simples (Auth/Profile/User)
  — ne pas mélanger les deux styles dans le même type de module.
- Pas de commentaire qui explique le QUOI (déjà lisible dans le code). Un commentaire
  seulement pour un invariant caché, une contrainte non évidente, ou pourquoi un choix
  contre-intuitif a été fait.
- Pas de `// TODO: implémenter` ni d'implémentation à moitié faite. Une dette
  consciente se documente en ADR ou dans le résumé de session, pas en commentaire dans
  le code.
- Cible mobile : 60 fps stables sur un Android milieu de gamme de ~3 ans — critère de
  recette, pas une intention.

## Règles Git

Conventional Commits (`feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `chore:`).
`main` toujours déployable, branches courtes. Un ADR par décision structurante
(Contexte / Décision / Conséquences / Alternatives écartées) — voir `docs/adr/`.

Aucun commit n'a encore été fait sur ce dépôt (`git log` est vide) : tout le travail
existant est en working tree. Ne jamais commiter sans demande explicite de
l'utilisateur, même si l'historique est actuellement vide.

## Contraintes métier

- **C1 — Batterie** : risque n°1. Échantillonnage GPS adaptatif, pas de polling
  inutile, pas d'animation décorative. Toute PR touchant la boucle de localisation doit
  justifier son coût énergétique.
- **C2 — Zéro interaction fine en roulant** : tout se configure à l'arrêt ; guidage
  vocal. Cibles tactiles ≥ 64dp (usage avec gants).
- **C3 — Réseau dégradé/hors-ligne** : buffer local persistant, envoi idempotent,
  dégradation gracieuse explicite à l'écran.
- **C4 — Données de localisation sensibles** : jamais de coordonnées dans les logs.
  Rétention limitée, purge automatisée, export et suppression de compte réellement
  implémentés (pas juste prévus), hébergement UE.
- **C5 — Budget < 100 €/mois** : auto-hébergement, tiers gratuits, justifier tout
  service managé.
- **C6 — Solo dev** : lisibilité prime sur l'astuce ; pas d'abstraction qu'un
  contributeur seul ne comprendrait pas dans 3 mois.

Deux règles physiques à ne jamais enfreindre dans le code de navigation : la vitesse
vient de `location.speed` (Doppler GNSS), jamais d'une dérivée de deux positions (bruit
≈ ±18 km/h) ; le cap vient de `course`, fiable seulement au-dessus de ~5 km/h — le figer
en dessous de ce seuil pour éviter que la flèche tourne aléatoirement à l'arrêt.

Direction artistique : sombre par défaut, contraste élevé ; mode jour à très forte
luminosité distinct (pas construit) ; deux modes d'écran radicalement différents
(préparation dense vs guidage minimal, 3 infos max) ; une seule couleur d'accent pour
l'action, rouge réservé aux alertes, jamais de couleur décorative en guidage ; chiffres
tabulaires pour vitesse/distance ; animations strictement fonctionnelles.

Périmètre V1 : compte via Apple/Google uniquement (F1, pas de mot de passe — voir
ADR sur l'auth à venir), profil, carte, recherche, création d'itinéraire, import GPX,
guidage turn-by-turn, enregistrement de trace, résumé de balade, historique, cartes
hors-ligne (portée réduite : pré-cache du corridor de l'itinéraire, pas de téléchargement
de région complète), réglages/RGPD. Hors périmètre V1, ne pas anticiper au-delà du
nommage : suivi de groupe temps réel, chat vocal/WebRTC, chat de proximité, système
communautaire, site web, notifications push, détection de chute/SOS, Kafka/CQRS/Event
Sourcing/microservices.
