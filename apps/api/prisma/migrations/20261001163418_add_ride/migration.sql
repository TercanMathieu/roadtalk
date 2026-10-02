-- CreateTable
CREATE TABLE "rides" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "ended_at" TIMESTAMPTZ(3) NOT NULL,
    "distance_meters" DOUBLE PRECISION NOT NULL,
    "duration_seconds" DOUBLE PRECISION NOT NULL,
    "average_speed_mps" DOUBLE PRECISION NOT NULL,
    "max_speed_mps" DOUBLE PRECISION NOT NULL,
    "elevation_gain_meters" DOUBLE PRECISION NOT NULL,
    "track" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rides_owner_id_started_at_idx" ON "rides"("owner_id", "started_at");

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
