-- Venta por unidad/display ademas de por bulto cerrado (Landy, Chocolates, Vinos, etc.)
ALTER TABLE "Product" ADD COLUMN "unitPrice" DECIMAL(12,2);
ALTER TABLE "Product" ADD COLUMN "displayPrice" DECIMAL(12,2);
ALTER TABLE "Product" ADD COLUMN "unitsPerDisplay" INTEGER;
