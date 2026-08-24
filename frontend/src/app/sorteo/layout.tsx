export const metadata = {
  title: 'Sorteo | Participá y ganá',
  description: 'Comprá tus chances, transferí y participá. Los números se asignan al azar apenas verificamos el pago.',
};

export default function SorteoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* El body lo pinta el tema del CRM (claro por defecto) y se filtra por debajo de
          la landing, que es oscura. Se pinta acá para que valga solo en esta ruta. */}
      <style>{'body{background:#07070b}'}</style>
      {children}
    </>
  );
}
