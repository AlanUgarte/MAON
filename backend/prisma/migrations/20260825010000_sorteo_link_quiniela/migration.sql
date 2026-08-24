-- Link a los resultados oficiales de la quiniela, para que se pueda verificar el ganador.
ALTER TABLE "SorteoSettings" ADD COLUMN "drawUrl" TEXT NOT NULL DEFAULT '';
