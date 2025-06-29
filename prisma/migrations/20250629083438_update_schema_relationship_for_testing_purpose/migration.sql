-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "VTUTransaction" DROP CONSTRAINT "VTUTransaction_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "VTUTransaction" DROP CONSTRAINT "VTUTransaction_userId_fkey";
