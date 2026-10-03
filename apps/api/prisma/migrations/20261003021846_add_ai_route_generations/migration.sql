-- CreateTable
CREATE TABLE "ai_route_generations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "succeeded" BOOLEAN NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_route_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_route_generations_user_id_created_at_idx" ON "ai_route_generations"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_route_generations" ADD CONSTRAINT "ai_route_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
