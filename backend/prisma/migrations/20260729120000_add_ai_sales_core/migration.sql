-- CreateEnum
CREATE TYPE "AIMode" AS ENUM ('AI_ACTIVE', 'HUMAN_REQUESTED', 'HUMAN_ACTIVE', 'AI_PAUSED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ABIERTO', 'CONFIRMADO', 'ABANDONADO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'REEMBOLSADO');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "aiMode" "AIMode" NOT NULL DEFAULT 'AI_ACTIVE',
ADD COLUMN "aiPausedAt" TIMESTAMP(3),
ADD COLUMN "takenOverById" TEXT;

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ABIERTO',
    "wantsShipping" BOOLEAN,
    "shippingAddress" TEXT,
    "saleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "externalId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "amount" DECIMAL(12,2) NOT NULL,
    "checkoutUrl" TEXT,
    "rawWebhook" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIToolCall" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_conversationId_key" ON "Cart"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_saleId_key" ON "Cart"("saleId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_saleId_key" ON "Payment"("saleId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_externalId_idx" ON "Payment"("externalId");

-- CreateIndex
CREATE INDEX "AIToolCall_conversationId_idx" ON "AIToolCall"("conversationId");

-- CreateIndex
CREATE INDEX "AIToolCall_tool_idx" ON "AIToolCall"("tool");

-- CreateIndex
CREATE INDEX "Conversation_aiMode_idx" ON "Conversation"("aiMode");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_takenOverById_fkey" FOREIGN KEY ("takenOverById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
