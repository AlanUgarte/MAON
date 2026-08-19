-- El pedido se arma en la web pero se cierra por WhatsApp, mismo criterio que
-- Tienda/Estufa/Dark Store/Supremas.
ALTER TABLE "InsumosSettings" ADD COLUMN "whatsappNumber" TEXT NOT NULL DEFAULT '5493413807110';
