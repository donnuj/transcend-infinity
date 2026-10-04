-- AlterColumn: Purchase.amount Float → Decimal(10,2) for monetary precision
ALTER TABLE "Purchase" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);
