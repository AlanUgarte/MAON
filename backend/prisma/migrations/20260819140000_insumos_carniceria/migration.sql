-- Modulo UGARTE INSUMOS CARNICERIA: tienda de insumos para carnicerias (arranca con
-- hojas de sierra Kaiser). Mismo patron que VYNO: pago por transferencia con
-- comprobante y aprobacion manual del admin, Client compartido de todo el CRM.

-- CreateEnum
CREATE TYPE "InsumosOrderStatus" AS ENUM ('NUEVO', 'PAGO_PENDIENTE', 'COMPROBANTE_RECIBIDO', 'PAGO_VERIFICADO', 'LISTO_PARA_DESPACHAR', 'DESPACHADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "InsumosProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "compareAtPrice" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "ratingAvg" DECIMAL(2,1),
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsumosProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsumosOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "InsumosOrderStatus" NOT NULL DEFAULT 'NUEVO',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shippingCost" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "streetNumber" TEXT NOT NULL,
    "floorApt" TEXT,
    "shippingNotes" TEXT,
    "docNumber" TEXT,
    "shippingMethod" TEXT,
    "shippingQuoteRaw" JSONB,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsumosOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsumosOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "InsumosOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsumosPaymentProof" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsumosPaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsumosSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "shippingFlatCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentAlias" TEXT NOT NULL DEFAULT 'Alan.ugarte7',
    "aboutText" TEXT,
    "privacyPolicy" TEXT,
    "termsAndConditions" TEXT,
    "returnsPolicy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsumosSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsumosProduct_slug_key" ON "InsumosProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "InsumosOrder_orderNumber_key" ON "InsumosOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "InsumosOrder_clientId_idx" ON "InsumosOrder"("clientId");

-- CreateIndex
CREATE INDEX "InsumosOrder_status_idx" ON "InsumosOrder"("status");

-- CreateIndex
CREATE INDEX "InsumosOrder_createdAt_idx" ON "InsumosOrder"("createdAt");

-- CreateIndex
CREATE INDEX "InsumosOrderItem_orderId_idx" ON "InsumosOrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "InsumosPaymentProof_orderId_key" ON "InsumosPaymentProof"("orderId");

-- AddForeignKey
ALTER TABLE "InsumosOrder" ADD CONSTRAINT "InsumosOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumosOrder" ADD CONSTRAINT "InsumosOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumosOrderItem" ADD CONSTRAINT "InsumosOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "InsumosOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumosOrderItem" ADD CONSTRAINT "InsumosOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsumosProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumosPaymentProof" ADD CONSTRAINT "InsumosPaymentProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "InsumosOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
