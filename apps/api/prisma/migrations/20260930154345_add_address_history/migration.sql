-- CreateTable
CREATE TABLE "address_history_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "context" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "selected_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "address_history_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "address_history_entries_user_id_selected_at_idx" ON "address_history_entries"("user_id", "selected_at");

-- CreateIndex
CREATE UNIQUE INDEX "address_history_entries_user_id_label_latitude_longitude_key" ON "address_history_entries"("user_id", "label", "latitude", "longitude");

-- AddForeignKey
ALTER TABLE "address_history_entries" ADD CONSTRAINT "address_history_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
