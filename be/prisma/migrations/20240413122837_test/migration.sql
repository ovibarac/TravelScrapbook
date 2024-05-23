/*
  Warnings:

  - You are about to drop the column `size` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "size",
ALTER COLUMN "tripId" DROP NOT NULL;
