-- CreateTable
CREATE TABLE "CotillonSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "storeOpen" BOOLEAN NOT NULL DEFAULT true,
    "topBannerText" TEXT NOT NULL DEFAULT 'Cotillón para tu fiesta · Envíos a todo el país',
    "heroBadge" TEXT NOT NULL DEFAULT 'Cotillón para tu fiesta',
    "heroTitle" TEXT NOT NULL DEFAULT 'Todo el cotillón para tu evento',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Globos, decoración, disfraces y accesorios al por mayor. Armá tu pedido y confirmalo por WhatsApp.',
    "heroImageUrl" TEXT,
    "minCompra" INTEGER NOT NULL DEFAULT 30000,
    "envioGratisDesde" INTEGER NOT NULL DEFAULT 60000,
    "whatsappNumber" TEXT NOT NULL DEFAULT '5493412708638',
    "margenVenta" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "hiddenProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productPromos" JSONB NOT NULL DEFAULT '{}',
    "heroCarousel" JSONB NOT NULL DEFAULT '[]',
    "promoCards" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CotillonSettings_pkey" PRIMARY KEY ("id")
);
