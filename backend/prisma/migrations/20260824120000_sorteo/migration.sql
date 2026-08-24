-- Modulo SORTEO: rifa por numeros. El comprador elige un paquete de chances,
-- transfiere al alias y sube el comprobante; los numeros NO se asignan al comprar,
-- recien cuando el admin verifica el pago y aprueba la orden. La PK (edition,
-- number) de SorteoNumber es la que garantiza que un numero no se venda dos veces.

-- CreateEnum
CREATE TYPE "SorteoOrderStatus" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "SorteoSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "edition" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL DEFAULT 'PARTICIPA POR LA MOTO 0KM!',
    "prize" TEXT NOT NULL DEFAULT 'MOTO 0KM',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalNumbers" INTEGER NOT NULL DEFAULT 10000,
    "drawDate" TEXT NOT NULL DEFAULT '',
    "drawWhere" TEXT NOT NULL DEFAULT '',
    "blessedNumbers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "blessedPrize" TEXT NOT NULL DEFAULT '',
    "paymentAlias" TEXT NOT NULL DEFAULT 'Alan.ugarte7',
    "paymentHolder" TEXT NOT NULL DEFAULT '',
    "whatsappNumber" TEXT NOT NULL DEFAULT '5493413807110',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SorteoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SorteoPackage" (
    "id" TEXT NOT NULL,
    "chances" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SorteoPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SorteoOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "edition" INTEGER NOT NULL DEFAULT 1,
    "status" "SorteoOrderStatus" NOT NULL DEFAULT 'PENDIENTE',
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL DEFAULT '',
    "buyerPhone" TEXT NOT NULL DEFAULT '',
    "packageId" TEXT,
    "chances" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "receiptUrl" TEXT,
    "holderName" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SorteoOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SorteoNumber" (
    "edition" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "SorteoNumber_pkey" PRIMARY KEY ("edition","number")
);

-- CreateTable
CREATE TABLE "SorteoWinner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    "prize" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SorteoWinner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SorteoOrder_orderNumber_key" ON "SorteoOrder"("orderNumber");
CREATE INDEX "SorteoOrder_status_idx" ON "SorteoOrder"("status");
CREATE INDEX "SorteoOrder_buyerEmail_idx" ON "SorteoOrder"("buyerEmail");
CREATE INDEX "SorteoOrder_buyerPhone_idx" ON "SorteoOrder"("buyerPhone");
CREATE INDEX "SorteoOrder_edition_idx" ON "SorteoOrder"("edition");
CREATE INDEX "SorteoNumber_orderId_idx" ON "SorteoNumber"("orderId");

-- AddForeignKey
ALTER TABLE "SorteoOrder" ADD CONSTRAINT "SorteoOrder_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SorteoPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SorteoOrder" ADD CONSTRAINT "SorteoOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SorteoNumber" ADD CONSTRAINT "SorteoNumber_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SorteoOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
