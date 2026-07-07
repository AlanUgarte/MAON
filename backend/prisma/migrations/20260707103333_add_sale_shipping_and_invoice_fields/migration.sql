-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "availableSchedule" TEXT,
ADD COLUMN     "comprobanteNumero" TEXT,
ADD COLUMN     "envioGratis" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invoiced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "wantsShipping" BOOLEAN NOT NULL DEFAULT false;

