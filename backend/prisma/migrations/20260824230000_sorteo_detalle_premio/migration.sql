-- El premio se nombra corto ("MOTO") en los textos de la landing; el detalle completo
-- (marca, modelo, color, papeles) va en su propio apartado.

ALTER TABLE "SorteoSettings" ADD COLUMN "prizeDetails" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SorteoSettings" ALTER COLUMN "prize" SET DEFAULT 'MOTO';
