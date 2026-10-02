-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "name" TEXT,
    "waypoints" JSONB NOT NULL,
    "avoid_highways" BOOLEAN NOT NULL,
    "avoid_tolls" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "distance_meters" DOUBLE PRECISION,
    "duration_seconds" DOUBLE PRECISION,
    "elevation_gain_meters" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routes_author_id_created_at_idx" ON "routes"("author_id", "created_at");

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
