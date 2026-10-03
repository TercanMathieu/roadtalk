-- AlterTable
ALTER TABLE "users" ADD COLUMN     "username_rejected_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "blocked_username_terms" (
    "id" UUID NOT NULL,
    "term" TEXT NOT NULL,
    "match" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_username_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocked_username_terms_term_key" ON "blocked_username_terms"("term");
