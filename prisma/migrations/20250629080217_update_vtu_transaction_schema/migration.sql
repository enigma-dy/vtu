/*
  Warnings:

  - Added the required column `email` to the `VTUTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VTUTransaction" ADD COLUMN     "email" TEXT NOT NULL;
