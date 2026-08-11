-- Modulo Supremas de Pollo: costeo por ingrediente, produccion por lote, ventas
-- con precio por tramo de cliente. El cliente sigue siendo el Client compartido
-- de todo el CRM (relacion, no tabla propia).

-- CreateEnum
CREATE TYPE "SupremaClientType" AS ENUM ('CONSUMIDOR_FINAL', 'KIOSCO', 'MAYORISTA');

-- CreateEnum
CREATE TYPE "SupremaPaymentMethod" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'OTRO');

-- CreateTable
CREATE TABLE "SupremaSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "priceConsumidorFinal" DECIMAL(12,2) NOT NULL DEFAULT 7000,
    "priceKiosco" DECIMAL(12,2) NOT NULL DEFAULT 6500,
    "priceMayorista" DECIMAL(12,2) NOT NULL DEFAULT 6000,
    "mayoristaMinKg" INTEGER NOT NULL DEFAULT 15,
    "envaseCostPerKg" DECIMAL(12,2) NOT NULL DEFAULT 500,
    "pechugaBaseKg" DECIMAL(12,2) NOT NULL DEFAULT 5,
    "produccionBaseKg" DECIMAL(12,2) NOT NULL DEFAULT 9,
    "blockNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupremaSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupremaIngredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchaseQty" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "usedQty" DECIMAL(12,3) NOT NULL,
    "supplier" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupremaIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupremaBatch" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lote" TEXT NOT NULL,
    "kgProducidos" DECIMAL(12,3) NOT NULL,
    "costoTotal" DECIMAL(12,2) NOT NULL,
    "costoPorKg" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupremaBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupremaSale" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sellerId" TEXT,
    "clientType" "SupremaClientType" NOT NULL,
    "kg" DECIMAL(12,3) NOT NULL,
    "pricePerKg" DECIMAL(12,2) NOT NULL,
    "costPerKg" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "profit" DECIMAL(12,2) NOT NULL,
    "marginPct" DECIMAL(6,2) NOT NULL,
    "paymentMethod" "SupremaPaymentMethod" NOT NULL,
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupremaSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupremaBatch_fecha_idx" ON "SupremaBatch"("fecha");

-- CreateIndex
CREATE INDEX "SupremaSale_clientId_idx" ON "SupremaSale"("clientId");

-- CreateIndex
CREATE INDEX "SupremaSale_fecha_idx" ON "SupremaSale"("fecha");

-- CreateIndex
CREATE INDEX "SupremaSale_clientType_idx" ON "SupremaSale"("clientType");

-- AddForeignKey
ALTER TABLE "SupremaSale" ADD CONSTRAINT "SupremaSale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupremaSale" ADD CONSTRAINT "SupremaSale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
