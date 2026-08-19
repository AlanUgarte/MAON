-- Modulo VYNO: tienda e-commerce real (retail directo), pago por transferencia con
-- comprobante y aprobacion manual del admin, envio con costo placeholder hasta
-- conectar Andreani. Cliente sigue siendo el Client compartido de todo el CRM.

-- CreateEnum
CREATE TYPE "VynoOrderStatus" AS ENUM ('NUEVO', 'PAGO_PENDIENTE', 'COMPROBANTE_RECIBIDO', 'PAGO_VERIFICADO', 'LISTO_PARA_DESPACHAR', 'DESPACHADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "VynoProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "compareAtPrice" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "installments" INTEGER,
    "ratingAvg" DECIMAL(2,1),
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VynoProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VynoOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "VynoOrderStatus" NOT NULL DEFAULT 'NUEVO',
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

    CONSTRAINT "VynoOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VynoOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "VynoOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VynoPaymentProof" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "operationNumber" TEXT,
    "transferredAt" TIMESTAMP(3),
    "holderName" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VynoPaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VynoSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "shippingFlatCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentAlias" TEXT NOT NULL DEFAULT 'Alan.ugarte7',
    "aboutText" TEXT,
    "privacyPolicy" TEXT,
    "termsAndConditions" TEXT,
    "returnsPolicy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VynoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VynoProduct_slug_key" ON "VynoProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VynoOrder_orderNumber_key" ON "VynoOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "VynoOrder_clientId_idx" ON "VynoOrder"("clientId");

-- CreateIndex
CREATE INDEX "VynoOrder_status_idx" ON "VynoOrder"("status");

-- CreateIndex
CREATE INDEX "VynoOrder_createdAt_idx" ON "VynoOrder"("createdAt");

-- CreateIndex
CREATE INDEX "VynoOrderItem_orderId_idx" ON "VynoOrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "VynoPaymentProof_orderId_key" ON "VynoPaymentProof"("orderId");

-- AddForeignKey
ALTER TABLE "VynoOrder" ADD CONSTRAINT "VynoOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VynoOrder" ADD CONSTRAINT "VynoOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VynoOrderItem" ADD CONSTRAINT "VynoOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "VynoOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VynoOrderItem" ADD CONSTRAINT "VynoOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "VynoProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VynoPaymentProof" ADD CONSTRAINT "VynoPaymentProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "VynoOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
