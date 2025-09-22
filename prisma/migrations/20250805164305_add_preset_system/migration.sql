-- CreateEnum
CREATE TYPE "public"."PresetCheckoutStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."PresetItemStatus" AS ENUM ('PENDING', 'ASSIGNED', 'CHECKED_OUT', 'SUBSTITUTED', 'UNAVAILABLE', 'SKIPPED');

-- AlterTable
ALTER TABLE "public"."asset_groups" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "public"."asset_transactions" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "public"."assets" ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "public"."presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "estimatedDuration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."preset_items" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "assetId" TEXT,
    "category" "public"."AssetCategory",
    "name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "preset_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."preset_substitutions" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "presetItemId" TEXT NOT NULL,
    "substituteAssetId" TEXT NOT NULL,
    "preferenceOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "preset_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."preset_checkouts" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."PresetCheckoutStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "checkoutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "actualReturnDate" TIMESTAMP(3),
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "preset_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."preset_checkout_items" (
    "id" TEXT NOT NULL,
    "presetCheckoutId" TEXT NOT NULL,
    "presetItemId" TEXT NOT NULL,
    "assetId" TEXT,
    "status" "public"."PresetItemStatus" NOT NULL DEFAULT 'PENDING',
    "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preset_checkout_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "room" TEXT,
    "description" TEXT,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "preset_substitutions_presetItemId_substituteAssetId_key" ON "public"."preset_substitutions"("presetItemId", "substituteAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "preset_checkout_items_presetCheckoutId_presetItemId_key" ON "public"."preset_checkout_items"("presetCheckoutId", "presetItemId");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "public"."locations"("name");

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_transactions" ADD CONSTRAINT "asset_transactions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_groups" ADD CONSTRAINT "asset_groups_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."presets" ADD CONSTRAINT "presets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_items" ADD CONSTRAINT "preset_items_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "public"."presets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_items" ADD CONSTRAINT "preset_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_substitutions" ADD CONSTRAINT "preset_substitutions_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "public"."presets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_substitutions" ADD CONSTRAINT "preset_substitutions_presetItemId_fkey" FOREIGN KEY ("presetItemId") REFERENCES "public"."preset_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_substitutions" ADD CONSTRAINT "preset_substitutions_substituteAssetId_fkey" FOREIGN KEY ("substituteAssetId") REFERENCES "public"."assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_checkouts" ADD CONSTRAINT "preset_checkouts_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "public"."presets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_checkouts" ADD CONSTRAINT "preset_checkouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_checkout_items" ADD CONSTRAINT "preset_checkout_items_presetCheckoutId_fkey" FOREIGN KEY ("presetCheckoutId") REFERENCES "public"."preset_checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_checkout_items" ADD CONSTRAINT "preset_checkout_items_presetItemId_fkey" FOREIGN KEY ("presetItemId") REFERENCES "public"."preset_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preset_checkout_items" ADD CONSTRAINT "preset_checkout_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
