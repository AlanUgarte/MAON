-- Tercer tramo de precio para la tienda online: 1-5kg consumidor final, 6-15kg
-- kiosco, 16+ mayorista. mayoristaMinKg pasa de 15 a 16 para que el corte sea justo ahi.
ALTER TABLE "SupremaSettings" ADD COLUMN "kioscoMinKg" INTEGER NOT NULL DEFAULT 6;
UPDATE "SupremaSettings" SET "kioscoMinKg" = 6, "mayoristaMinKg" = 16 WHERE "id" = 'singleton';
