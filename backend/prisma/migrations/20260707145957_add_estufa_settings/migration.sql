-- CreateTable
CREATE TABLE "EstufaSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "storeOpen" BOOLEAN NOT NULL DEFAULT true,
    "topBannerText" TEXT NOT NULL DEFAULT 'Envíos a todo el país · Stock disponible',
    "heroBadge" TEXT NOT NULL DEFAULT 'Calor instantáneo para tu casa',
    "heroTitle" TEXT NOT NULL DEFAULT 'Estufa Halógena de Cuarzo',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Calienta rápido cualquier ambiente chico o mediano, es liviana y se traslada fácil por toda la casa.',
    "price" DECIMAL(12,2) NOT NULL DEFAULT 20000,
    "whatsappNumber" TEXT NOT NULL DEFAULT '5493412708638',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstufaSettings_pkey" PRIMARY KEY ("id")
);

