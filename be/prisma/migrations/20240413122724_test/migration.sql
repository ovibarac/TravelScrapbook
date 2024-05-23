/*
  Warnings:

  - Added the required column `name` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "name" TEXT NOT NULL;
