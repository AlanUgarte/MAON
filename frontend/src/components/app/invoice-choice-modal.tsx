'use client';
import { X, Receipt, FileText } from 'lucide-react';

export function InvoiceChoiceModal({
  onClose, onChoose,
}: {
  onClose: () => void;
  onChoose: (tipo: 'REMITO' | 'FACTURA', letra: 'R' | 'B' | 'A') => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-2xl border border-line/10 bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-bold text-content">¿Cómo facturamos este pedido?</div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted" /></button>
        </div>
        <div className="space-y-2">
          <button onClick={() => onChoose('REMITO', 'R')} className="flex w-full items-center gap-3 rounded-xl border border-line/15 p-3 text-left transition hover:bg-surface-2">
            <Receipt className="h-5 w-5 shrink-0 text-muted" />
            <div>
              <div className="text-sm font-semibold text-content">Remito (en negro)</div>
              <div className="text-[11px] text-muted">Sin CAE, no es un comprobante fiscal válido. Se genera solo, al toque.</div>
            </div>
          </button>
          <button onClick={() => onChoose('FACTURA', 'B')} className="flex w-full items-center gap-3 rounded-xl border border-line/15 p-3 text-left transition hover:bg-surface-2">
            <FileText className="h-5 w-5 shrink-0 text-muted" />
            <div>
              <div className="text-sm font-semibold text-content">Factura B (en blanco)</div>
              <div className="text-[11px] text-muted">Comprobante fiscal, no requiere CAE. Se genera solo, al toque.</div>
            </div>
          </button>
          <button onClick={() => onChoose('FACTURA', 'A')} className="flex w-full items-center gap-3 rounded-xl border border-line/15 p-3 text-left transition hover:bg-surface-2">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="text-sm font-semibold text-content">Factura A (en blanco, con CAE)</div>
              <div className="text-[11px] text-muted">Requiere CAE de ARCA — te lleva al formulario con los ítems ya cargados para completarlo.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
