/*
  Warnings:

  - Added the required column `createdById` to the `maintenance_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."maintenance_records" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM';

-- AddForeignKey
ALTER TABLE "public"."maintenance_records" ADD CONSTRAINT "maintenance_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
