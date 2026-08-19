-- La hoja de sierra se vende por medida (largo en metros) a precio unico —
-- el cliente elige una medida antes de comprar, se guarda por item de pedido.
ALTER TABLE "InsumosOrderItem" ADD COLUMN "size" TEXT;
