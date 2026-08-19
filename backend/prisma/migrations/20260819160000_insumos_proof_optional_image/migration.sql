-- A pedido de Alan: con el nombre del titular alcanza para informar el pago, el
-- comprobante pasa a ser opcional en vez de obligatorio.
ALTER TABLE "InsumosPaymentProof" ALTER COLUMN "imageUrl" DROP NOT NULL;
