/**
 * Datos fijos del negocio que la IA puede pasarle al cliente tal cual —
 * no son inventados, son reales, así que no rompen la regla de "nunca
 * inventar información". Vía env var por si algún día cambian sin redeploy.
 */
export function getTransferInstructions(): { alias: string; cbu: string; bank: string; holder: string } {
  return {
    alias: process.env.TRANSFER_ALIAS || 'alan.ugarte7',
    cbu: process.env.TRANSFER_CBU || '2850792940095652605918',
    bank: process.env.TRANSFER_BANK || 'Banco Macro',
    holder: process.env.TRANSFER_HOLDER || 'Alan Ugarte',
  };
}
