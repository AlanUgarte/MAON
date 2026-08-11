-- Aclara el modo de venta (bulto/unidad/display) de una linea del pedido, para que el
-- remito no confunda "2 bultos" con "2 unidades sueltas" del mismo SKU.
ALTER TABLE "SaleItem" ADD COLUMN "note" TEXT;
