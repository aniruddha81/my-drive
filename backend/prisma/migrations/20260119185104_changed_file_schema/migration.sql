/*
  Warnings:

  - A unique constraint covering the columns `[assetId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assetId` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "assetId" TEXT NOT NULL,
ADD COLUMN     "displayName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_assetId_key" ON "File"("assetId");

-- CreateIndex
CREATE INDEX "File_assetId_idx" ON "File"("assetId");
