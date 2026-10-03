-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_paymentId_key" ON "Purchase"("paymentId");

-- CreateIndex
CREATE INDEX "Purchase_accountId_idx" ON "Purchase"("accountId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
