-- Identifiant public "Pseudo#TAG" (ADR-003) : l'unicité passe du pseudo seul
-- à la paire (pseudo sans casse, tag).

-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tag" TEXT,
ADD COLUMN     "username_changed_at" TIMESTAMPTZ(3),
ADD COLUMN     "username_key" TEXT;

-- Comptes existants : le pseudo déjà choisi est conservé, sa forme de
-- comparaison en est dérivée, et un tag de 4 consonnes leur est tiré au
-- hasard. `WHERE "users"."id" IS NOT NULL` rend la sous-requête dépendante de
-- la ligne : sans cela Postgres ne l'évaluerait qu'une fois et donnerait le
-- même tag à tout le monde. `username_changed_at` reste NULL : ces comptes
-- n'ont pas encore utilisé leur changement d'identifiant.
UPDATE "users"
SET "username_key" = lower("username"),
    "tag" = (
      SELECT string_agg(substr('BCDFGHJKLMNPQRSTVWXZ', (floor(random() * 20) + 1)::int, 1), '')
      FROM generate_series(1, 4)
      WHERE "users"."id" IS NOT NULL
    )
WHERE "username" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key_tag_key" ON "users"("username_key", "tag");
