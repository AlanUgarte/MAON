-- Dark Store: settings singleton, catálogo manual de Vapeadores, y datos de checkout
-- (barrio elegido + líneas de vapeadores) en Sale.

CREATE TABLE "DarkStoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "storeOpen" BOOLEAN NOT NULL DEFAULT true,
    "storeName" TEXT NOT NULL DEFAULT 'MAON Dark Store',
    "tagline" TEXT NOT NULL DEFAULT 'Tu pedido en hasta 20 minutos.',
    "logoUrl" TEXT,
    "heroCarousel" JSONB NOT NULL DEFAULT '[]',
    "promoCards" JSONB NOT NULL DEFAULT '[]',
    "scheduleStart" TEXT NOT NULL DEFAULT '18:00',
    "scheduleEnd" TEXT NOT NULL DEFAULT '23:00',
    "deliveryEtaMinutes" INTEGER NOT NULL DEFAULT 20,
    "deliveryBarrios" TEXT[] DEFAULT ARRAY['Las Malvinas', 'Refinería', 'Luis Agote', 'Alberto Olmedo', 'Azcuénaga', 'Barrio Parque', 'Centro', 'Bella Vista', 'Latinoamérica', 'Puerto Norte']::TEXT[],
    "margenPct" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "minOrderAmount" INTEGER NOT NULL DEFAULT 0,
    "maxOrderAmount" INTEGER,
    "whatsappNumber" TEXT NOT NULL DEFAULT '5493413807110',
    "whatsappTemplate" TEXT,
    "hiddenProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DarkStoreSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DarkStoreVape" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DarkStoreVape_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DarkStoreVape_isActive_idx" ON "DarkStoreVape"("isActive");

ALTER TABLE "Sale" ADD COLUMN "barrio" TEXT;
ALTER TABLE "Sale" ADD COLUMN "vapeItems" JSONB DEFAULT '[]';
