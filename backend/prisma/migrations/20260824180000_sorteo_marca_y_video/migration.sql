-- Landing del sorteo: marca propia, video del premio y datos de contacto del footer.

ALTER TABLE "SorteoSettings" ADD COLUMN "brandName" TEXT NOT NULL DEFAULT 'TREBOL MOTOS';
ALTER TABLE "SorteoSettings" ADD COLUMN "videoUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SorteoSettings" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SorteoSettings" ADD COLUMN "instagramUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SorteoSettings" ADD COLUMN "facebookUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SorteoSettings" ADD COLUMN "tiktokUrl" TEXT NOT NULL DEFAULT '';
