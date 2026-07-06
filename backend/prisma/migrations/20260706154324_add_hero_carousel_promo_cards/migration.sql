-- AlterTable
ALTER TABLE "TiendaSettings" ADD COLUMN     "heroCarousel" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "promoCards" JSONB NOT NULL DEFAULT '[]';

