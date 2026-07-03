-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "ClientStage" AS ENUM ('NUEVO_LEAD', 'CONTACTADO', 'INTERESADO', 'NEGOCIANDO', 'ESPERANDO_RESPUESTA', 'VENTA_CERRADA', 'VENTA_PERDIDA');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('META_ADS', 'WHATSAPP', 'ORGANICO', 'REFERIDO', 'MANUAL');

-- CreateEnum
CREATE TYPE "BuyingIntent" AS ENUM ('ALTA', 'MEDIA', 'BAJA', 'DESCONOCIDA');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVO', 'NEUTRO', 'NEGATIVO');

-- CreateEnum
CREATE TYPE "ObjectionType" AS ENUM ('PRECIO', 'ENVIO', 'CONFIANZA', 'TIEMPO_ENTREGA', 'COMPETENCIA', 'NINGUNA');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('ENTRANTE', 'SALIENTE');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXTO', 'IMAGEN', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'UBICACION', 'PLANTILLA', 'SISTEMA');

-- CreateEnum
CREATE TYPE "MessageAuthor" AS ENUM ('CLIENTE', 'VENDEDOR', 'AUTOMATIZACION', 'IA', 'SISTEMA');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ABIERTA', 'PENDIENTE', 'CERRADA');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('BORRADOR', 'PROGRAMADA', 'ENVIANDO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "CampaignRecipientStatus" AS ENUM ('PENDIENTE', 'ENVIADO', 'ENTREGADO', 'LEIDO', 'RESPONDIDO', 'FALLIDO');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('SIN_RESPUESTA_HORAS', 'SIN_RESPUESTA_DIAS', 'COMPRA_REALIZADA', 'TIEMPO_DESDE_COMPRA', 'CAMBIO_ESTADO', 'NUEVO_LEAD');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('ENVIAR_MENSAJE', 'ENVIAR_PLANTILLA', 'CREAR_SEGUIMIENTO', 'CAMBIAR_ESTADO', 'AGREGAR_ETIQUETA');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDIENTE', 'COMPLETADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDIENTE', 'PAGADA', 'ENVIADA', 'ENTREGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "IvaCondition" AS ENUM ('RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'CONSUMIDOR_FINAL', 'EXENTO');

-- CreateEnum
CREATE TYPE "ComprobanteLetra" AS ENUM ('A', 'B', 'C', 'R');

-- CreateEnum
CREATE TYPE "ComprobanteTipo" AS ENUM ('FACTURA', 'REMITO', 'NOTA_CREDITO', 'NOTA_CREDITO_REMITO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VENDEDOR',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7C5CFC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientTag" (
    "clientId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ClientTag_pkey" PRIMARY KEY ("clientId","tagId")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "province" TEXT,
    "avatarUrl" TEXT,
    "businessName" TEXT,
    "cuit" TEXT,
    "ivaCondition" "IvaCondition" NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
    "address" TEXT,
    "postalCode" TEXT,
    "clientCode" TEXT,
    "condicionVenta" TEXT NOT NULL DEFAULT 'Contado',
    "stage" "ClientStage" NOT NULL DEFAULT 'NUEVO_LEAD',
    "source" "LeadSource" NOT NULL DEFAULT 'WHATSAPP',
    "interestedProductId" TEXT,
    "metaCampaignId" TEXT,
    "metaAdSetId" TEXT,
    "metaAdId" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "buyingIntent" "BuyingIntent" NOT NULL DEFAULT 'DESCONOCIDA',
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRO',
    "aiSummary" TEXT,
    "lastObjection" "ObjectionType" NOT NULL DEFAULT 'NINGUNA',
    "assignedSellerId" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ABIERTA',
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "waContactId" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "author" "MessageAuthor" NOT NULL DEFAULT 'CLIENTE',
    "type" "MessageType" NOT NULL DEFAULT 'TEXTO',
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "waMessageId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sellerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "buyingIntent" "BuyingIntent",
    "leadScore" INTEGER,
    "sentiment" "Sentiment",
    "objection" "ObjectionType",
    "nextAction" TEXT,
    "summary" TEXT,
    "suggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usedAI" BOOLEAN NOT NULL DEFAULT false,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "unitsPerBulk" INTEGER,
    "marginPct" DOUBLE PRECISION,
    "price" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sellerId" TEXT,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDIENTE',
    "metaCampaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "templateName" TEXT,
    "imageUrl" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'ACTIVE_WINDOW',
    "status" "CampaignStatus" NOT NULL DEFAULT 'BORRADOR',
    "filters" JSONB,
    "createdById" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "repliedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "CampaignRecipientStatus" NOT NULL DEFAULT 'PENDIENTE',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trigger" "AutomationTrigger" NOT NULL,
    "triggerConfig" JSONB,
    "actionType" "AutomationActionType" NOT NULL,
    "actionConfig" JSONB,
    "conditions" JSONB,
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDIENTE',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaCampaign" (
    "id" TEXT NOT NULL,
    "metaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT,
    "spend" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprobante" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "ComprobanteTipo" NOT NULL,
    "letra" "ComprobanteLetra" NOT NULL DEFAULT 'A',
    "clientId" TEXT NOT NULL,
    "sellerId" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "sign" INTEGER NOT NULL DEFAULT 1,
    "enBlanco" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,
    "cae" TEXT,
    "caeVto" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComprobanteItem" (
    "id" TEXT NOT NULL,
    "comprobanteId" TEXT NOT NULL,
    "productId" TEXT,
    "detalle" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "ivaRate" DOUBLE PRECISION NOT NULL DEFAULT 0.21,

    CONSTRAINT "ComprobanteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientCode_key" ON "Client"("clientCode");

-- CreateIndex
CREATE INDEX "Client_stage_idx" ON "Client"("stage");

-- CreateIndex
CREATE INDEX "Client_assignedSellerId_idx" ON "Client"("assignedSellerId");

-- CreateIndex
CREATE INDEX "Client_buyingIntent_idx" ON "Client"("buyingIntent");

-- CreateIndex
CREATE INDEX "Client_lastInboundAt_idx" ON "Client"("lastInboundAt");

-- CreateIndex
CREATE INDEX "Client_metaCampaignId_idx" ON "Client"("metaCampaignId");

-- CreateIndex
CREATE INDEX "Conversation_clientId_idx" ON "Conversation"("clientId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_waMessageId_key" ON "Message"("waMessageId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Note_clientId_idx" ON "Note"("clientId");

-- CreateIndex
CREATE INDEX "AIAnalysis_clientId_idx" ON "AIAnalysis"("clientId");

-- CreateIndex
CREATE INDEX "AIAnalysis_usedAI_idx" ON "AIAnalysis"("usedAI");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Sale_clientId_idx" ON "Sale"("clientId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "CampaignRecipient_status_idx" ON "CampaignRecipient"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_campaignId_clientId_key" ON "CampaignRecipient"("campaignId", "clientId");

-- CreateIndex
CREATE INDEX "Automation_isActive_idx" ON "Automation"("isActive");

-- CreateIndex
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");

-- CreateIndex
CREATE INDEX "FollowUp_dueAt_idx" ON "FollowUp"("dueAt");

-- CreateIndex
CREATE INDEX "FollowUp_clientId_idx" ON "FollowUp"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaCampaign_metaId_key" ON "MetaCampaign"("metaId");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobante_numero_key" ON "Comprobante"("numero");

-- CreateIndex
CREATE INDEX "Comprobante_clientId_idx" ON "Comprobante"("clientId");

-- CreateIndex
CREATE INDEX "Comprobante_tipo_idx" ON "Comprobante"("tipo");

-- CreateIndex
CREATE INDEX "Comprobante_issuedAt_idx" ON "Comprobante"("issuedAt");

-- CreateIndex
CREATE INDEX "ComprobanteItem_comprobanteId_idx" ON "ComprobanteItem"("comprobanteId");

-- AddForeignKey
ALTER TABLE "ClientTag" ADD CONSTRAINT "ClientTag_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTag" ADD CONSTRAINT "ClientTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_interestedProductId_fkey" FOREIGN KEY ("interestedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_metaCampaignId_fkey" FOREIGN KEY ("metaCampaignId") REFERENCES "MetaCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedSellerId_fkey" FOREIGN KEY ("assignedSellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_metaCampaignId_fkey" FOREIGN KEY ("metaCampaignId") REFERENCES "MetaCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComprobanteItem" ADD CONSTRAINT "ComprobanteItem_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "Comprobante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
