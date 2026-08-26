# ADR-001 — Frontières hexagonales par contexte

## Contexte

Le produit accueille une vraie complexité métier dans certains domaines : `Ride` a un
cycle de vie (planifiée → en cours → terminée) et portera des participants (V2), `Route`
est un itinéraire réutilisable et partageable, et `Navigation` (session 9) devra détecter
les écarts de route et recalculer un guidage. Cette logique doit rester testable sans
dépendre de Postgres, Redis, NestJS ou du réseau — c'est une exigence du projet
(Testcontainers réservé à l'intégration, le domaine se teste en pur TypeScript).

Sans discipline d'imports, le code métier finit toujours par importer un decorator
NestJS ou un type Drizzle "juste pour cette fois", et la logique de recalcul d'itinéraire
se retrouve couplée à un ORM qu'on ne peut plus changer sans tout réécrire.

## Décision

Pour les contextes à vraie logique métier — **Ride, Route, Navigation** — chaque module
suit une structure en couches :

```
src/modules/<context>/
  domain/           TypeScript pur, aucune dépendance externe (NestJS, Drizzle, HTTP...)
  application/       cas d'usage, orchestre le domaine
  infrastructure/    adaptateurs concrets (Drizzle, Redis, S3, Valhalla)
  presentation/       controllers, DTO
```

Règle de dépendance : les imports ne remontent que vers l'intérieur
(`infrastructure`/`presentation` → `application` → `domain`), jamais l'inverse. `domain`
n'importe rien d'autre que lui-même et les primitives partagées (`@roadtalk/domain-shared`).

Cette règle est vérifiée en CI par deux mécanismes complémentaires :

- `eslint-plugin-boundaries` (`apps/api/eslint.config.js`) empêche un import qui remonte
  la mauvaise direction entre couches.
- `no-restricted-imports`, ciblée sur `src/modules/*/domain/**`, interdit explicitement
  `@nestjs/*`, `drizzle-orm` et `fastify`.

Pour **Auth, Profile, Media** — pas de logique métier significative, essentiellement du
CRUD avec quelques règles de validation — on utilise un simple service applicatif +
repository, sans les quatre couches. Cette exception est volontaire : imposer
l'architecture hexagonale à un module qui fait `save(user)` / `findById(id)` n'apporterait
aucun bénéfice concret et ajouterait de la friction pour un seul développeur.

**Group (V2) n'est pas modélisé maintenant.** `Ride` porte déjà `participantIds` (toujours
`[ownerId]` en V1), ce qui suffit à ne pas coupler le cycle de vie de la balade à un
nombre fixe de participants. Quand `Group` arrivera, ce sera un agrégat séparé référencé
par un `groupId` optionnel sur `Ride` — aucune réécriture du domaine `Ride` ne sera
nécessaire.

**`User` n'est pas encore une entité de domaine.** Tant que le profil (session 4, F2)
n'est pas spécifié, un `User` ne serait qu'un `{ id }` — aucun invariant réel. `Ride` et
`Route` référencent uniquement le type `UserId` (`@roadtalk/domain-shared`) en attendant.

## Conséquences

- Le domaine (`Ride`, `Route`, futur `Navigation`) est testable en millisecondes, sans
  Testcontainers, sans mock d'infrastructure.
- Le typage en unions discriminées par statut rend certains états illégaux
  irreprésentables (impossible d'avoir un `CompletedRide` sans `summary`, par exemple).
- Plus de fichiers et d'indirection que pour un CRUD classique — assumé, uniquement pour
  les contextes qui en ont réellement besoin.
- Toute violation de frontière échoue en CI, pas seulement en revue de code humaine.

## Alternatives écartées

- **Hexagonal partout, y compris Auth/Profile/Media** — rejeté : coût de cérémonie sans
  bénéfice pour du CRUD ; chaque abstraction doit se justifier par un bénéfice concret à
  moins de 12 mois.
- **Aucune séparation (un seul dossier `services/` façon NestJS classique)** — rejeté : la
  logique de navigation (hors-route, recalcul) doit être testable unitairement et
  potentiellement réutilisable côté mobile plus tard ; la coupler à NestJS dès le début
  interdirait ça sans réécriture.
- **`Group` comme entité dès la V1** — rejeté : aucun code n'en a besoin aujourd'hui, ce
  serait de la dead code non testée.
