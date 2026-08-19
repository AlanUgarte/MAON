import { Playfair_Display } from 'next/font/google';

// Tipografía serif elegante, exclusiva de VYNO — no toca font-display (Space Grotesk)
// que usa el resto del CRM. Cargada acá (layout de segmento) para no pesarle el bundle
// a ninguna otra página que no sea /vyno/**.
const serif = Playfair_Display({ subsets: ['latin'], variable: '--font-vyno-serif', display: 'swap' });

export const metadata = {
  title: 'VYNO | Abridor de Vino Eléctrico 4 Piezas',
  description: 'Abrí tus vinos favoritos con un solo toque. Set de abridor eléctrico, vertedor, tapón hermético y base — elegancia y practicidad para tu mesa. Envíos a todo el país.',
  icons: { icon: '/vyno/favicon.svg' },
  openGraph: {
    title: 'VYNO | Abridor de Vino Eléctrico 4 Piezas',
    description: 'Elegancia, practicidad y tecnología en tu mesa. Envíos a todo el país.',
    type: 'website',
  },
};

export default function VynoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable}`}>{children}</div>;
}
