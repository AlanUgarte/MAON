-- CreateTable
CREATE TABLE "TiendaSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "storeOpen" BOOLEAN NOT NULL DEFAULT true,
    "topBannerText" TEXT NOT NULL DEFAULT 'Envíos a todo el país · Atención por WhatsApp',
    "heroBadge" TEXT NOT NULL DEFAULT 'Precios de mayorista, todo el año',
    "heroTitle" TEXT NOT NULL DEFAULT 'Golosinas, galletitas y alfajores al por mayor',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Armá tu pedido acá y confirmalo directo por WhatsApp — sin vueltas, sin registrarte.',
    "minCompra" INTEGER NOT NULL DEFAULT 50000,
    "envioGratisDesde" INTEGER NOT NULL DEFAULT 85000,
    "whatsappNumber" TEXT NOT NULL DEFAULT '5493412708638',
    "margenVenta" DOUBLE PRECISION NOT NULL DEFAULT 0.12,
    "hiddenProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productPromos" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiendaSettings_pkey" PRIMARY KEY ("id")
);

