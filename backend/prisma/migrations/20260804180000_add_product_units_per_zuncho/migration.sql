-- Algunos artículos no se venden por unidad suelta sino por "zuncho" (paquete chico de
-- varias unidades, ej. 5) — reutiliza el campo unitPrice (son excluyentes: nunca hay
-- precio real de unidad Y de zuncho a la vez), este campo solo aclara el tamaño del
-- zuncho para saber cómo mostrarlo.
ALTER TABLE "Product" ADD COLUMN "unitsPerZuncho" INTEGER;
