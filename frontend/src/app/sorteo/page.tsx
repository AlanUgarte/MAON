'use client';

// Landing pública del sorteo — identidad propia (negro verdoso + verde neón, la suerte),
// independiente del tema del CRM, mismo criterio que /insumos y /vyno: colores acá adentro.
// El flujo es: elegir paquete -> transferir al alias -> cargar el comprobante. Los
// números NO se asignan al comprar: se asignan cuando el admin verifica el pago.
import { useEffect, useState } from 'react';
import {
  Clover, ShoppingCart, Trophy, Copy, Check, X, Upload, Search, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { api, uploadSorteoReceipt } from '@/lib/api';

const BLACK = '#05100a';
const PANEL = '#0e1b13';
const LINE = 'rgba(255,255,255,0.09)';
const GREEN = '#2ee06a';
const GREEN_DARK = '#12833f';
const WHATSAPP = '#22c55e';
const GOLD = '#ffd75e';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

interface Pkg { id: string; chances: number; price: number; isPopular: boolean }
interface PublicSorteo {
  title: string; prize: string; images: string[]; drawDate: string; drawWhere: string;
  blessedPrize: string; blessedNumbers: { number: number; sold: boolean }[];
  paymentAlias: string; paymentHolder: string; whatsappNumber: string;
  isActive: boolean; totalNumbers: number; sold: number; percentSold: number;
  packages: Pkg[];
  winners: { id: string; name: string; number: number | null; prize: string; photoUrl: string | null; note: string | null }[];
}

export default function SorteoPage() {
  const [data, setData] = useState<PublicSorteo | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<Pkg | null>(null);

  useEffect(() => {
    api.sorteoPublic()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: BLACK, color: '#fff' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center" style={{ background: BLACK, color: '#fff' }}>
        No pudimos cargar el sorteo. Probá de nuevo en un rato.
      </div>
    );
  }

  const wa = `https://wa.me/${data.whatsappNumber}`;

  return (
    <div style={{ background: BLACK, color: '#f2f2f5', minHeight: '100vh' }}>
      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{ background: 'rgba(5,16,10,.92)', borderBottom: `1px solid ${LINE}` }}
      >
        <div className="mx-auto flex h-[62px] max-w-[1180px] items-center justify-between px-4">
          <a href="#inicio" className="flex items-center gap-2 font-extrabold tracking-tight" style={{ color: GREEN }}>
            <Clover className="h-5 w-5" fill="currentColor" /> SORTEO
          </a>
          <nav className="flex gap-5 text-[14px]" style={{ color: 'rgba(255,255,255,.6)' }}>
            <a href="#inicio">Inicio</a>
            <a href="#consulta">Mis números</a>
            <a href="#ganadores">Ganadores</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4">
        <section id="inicio" className="grid gap-10 py-12 lg:grid-cols-2">
          <div>
            <Carousel images={data.images} />
            <h1
              className="mt-6 text-center text-[clamp(22px,3vw,34px)] font-black uppercase"
              style={{ color: GREEN, textShadow: '0 0 18px rgba(46,224,106,.5)' }}
            >{data.title}</h1>
            <p className="mt-2 text-center text-[14px] font-semibold tracking-wide" style={{ color: GOLD }}>
              🍀 Mucha suerte y siempre con fe 🍀
            </p>
          </div>

          <div>
            <h2 className="mb-5 text-[clamp(20px,2.4vw,30px)] font-extrabold">Comprá que se van volando!</h2>

            <Panel className="text-center">
              <h3 className="mb-3.5 text-[15px] font-bold">Chances vendidas</h3>
              <div className="relative flex h-[26px] items-center overflow-hidden rounded-full" style={{ background: '#1a2a20' }}>
                <span
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(data.percentSold, 2)}%`, background: 'linear-gradient(90deg,#12833f,#2ee06a,#ffd75e)' }}
                />
                <b className="relative mx-auto text-[13px]">{data.percentSold}%</b>
              </div>
            </Panel>

            {!data.isActive && (
              <Panel><p className="text-center font-bold" style={{ color: GOLD }}>El sorteo está cerrado por el momento.</p></Panel>
            )}

            {data.packages.map((p) => (
              <Panel key={p.id} highlighted={p.isPopular}>
                {p.isPopular && (
                  <span
                    className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wider"
                    style={{ background: GREEN, color: '#fff' }}
                  >MÁS POPULAR</span>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[22px] font-extrabold">{p.chances} Chances</h3>
                    <small className="font-bold" style={{ color: GREEN }}>{p.chances} Chances por la {data.prize}</small>
                  </div>
                  <div className="text-right">
                    <span className="mb-2 block text-[26px] font-black" style={{ color: GREEN }}>{money(p.price)}</span>
                    <button
                      onClick={() => setBuying(p)}
                      disabled={!data.isActive}
                      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[15px] font-bold text-white transition disabled:opacity-40"
                      style={{ background: GREEN }}
                    ><ShoppingCart className="h-4 w-4" /> Comprar</button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </section>

        <section className="py-14">
          <h2 className="mb-8 text-center text-[clamp(26px,4vw,42px)] font-black">Premios</h2>
          <div className="mx-auto grid max-w-[760px] gap-5 sm:grid-cols-2">
            <Box>
              <div className="mb-3 font-extrabold" style={{ color: GOLD }}>1er Premio</div>
              <h3 className="text-[24px] font-black">{data.prize}</h3>
            </Box>
            {!!data.blessedNumbers.length && (
              <Box>
                <div className="font-extrabold" style={{ color: GOLD }}>🏆 PREMIOS SECUNDARIOS</div>
                <div className="mb-3 font-extrabold" style={{ color: GOLD }}>NÚMEROS BENDECIDOS 🙏</div>
                <div className="mb-3 flex flex-wrap justify-center gap-2.5">
                  {data.blessedNumbers.map((b) => (
                    <span
                      key={b.number}
                      className="rounded-[10px] border-2 px-4 py-2 text-[20px] font-extrabold"
                      style={b.sold
                        ? { borderColor: LINE, color: 'rgba(255,255,255,.35)', textDecoration: 'line-through' }
                        : { borderColor: GOLD, color: GOLD, background: 'rgba(255,215,94,.06)' }}
                    >{b.number}</span>
                  ))}
                </div>
                {data.blessedPrize && (
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,.6)' }}>
                    Si te toca alguno de estos números ganás <b style={{ color: '#fff' }}>{data.blessedPrize}</b> 🎁
                  </p>
                )}
              </Box>
            )}
          </div>
        </section>

        <section className="py-14">
          <h2 className="mb-8 text-center text-[clamp(26px,4vw,42px)] font-black">Preguntas frecuentes</h2>
          <div className="mx-auto max-w-[700px]">
            <Faq q="¿Cuándo se realiza el evento?" a={data.drawDate || 'A confirmar'} />
            <Faq q="¿En dónde vemos el ganador?" a={data.drawWhere || 'A confirmar'} />
            <Faq
              q="¿Cómo recibo mis números?"
              a="Apenas verificamos tu transferencia te asignamos los números al azar y te avisamos. También podés consultarlos acá abajo con tu email o tu WhatsApp."
            />
          </div>
        </section>

        <Consulta />

        {!!data.winners.length && (
          <section id="ganadores" className="py-14">
            <div className="mb-2 flex justify-center">
              <Trophy className="h-8 w-8" style={{ color: GOLD }} />
            </div>
            <h2 className="text-center text-[clamp(26px,4vw,42px)] font-black">Ganadores anteriores</h2>
            <p className="mb-8 text-center text-[14px]" style={{ color: 'rgba(255,255,255,.55)' }}>
              Conocé a las personas que ya ganaron con nosotros
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.winners.map((w) => (
                <div
                  key={w.id}
                  className="flex gap-4 overflow-hidden rounded-2xl"
                  style={{ background: PANEL, border: `1px solid ${LINE}` }}
                >
                  {w.photoUrl && <img src={w.photoUrl} alt="" className="h-full w-[130px] shrink-0 object-cover" />}
                  <div className="py-4 pr-4">
                    <span
                      className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ background: 'rgba(255,215,94,.12)', color: GOLD }}
                    >🏆 Ganador</span>
                    <h3 className="text-[20px] font-black uppercase">{w.name}</h3>
                    <p className="text-[13px]" style={{ color: 'rgba(255,255,255,.55)' }}>
                      {[w.number ? `N° ${w.number}` : null, w.prize, w.note].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="py-12 text-center" style={{ borderTop: `1px solid ${LINE}`, color: 'rgba(255,255,255,.55)' }}>
        <p>Consultas 👇</p>
        <a
          href={wa} target="_blank" rel="noopener noreferrer"
          className="mt-3 inline-block rounded-full px-7 py-3 font-bold text-white"
          style={{ background: WHATSAPP }}
        >WHATSAPP</a>
      </footer>

      {buying && <BuyModal pkg={buying} data={data} onClose={() => setBuying(null)} />}
    </div>
  );
}

// ------------------------------ piezas ------------------------------

function Panel({ children, className = '', highlighted }: { children: React.ReactNode; className?: string; highlighted?: boolean }) {
  return (
    <div
      className={`relative mb-4 rounded-2xl px-5 py-[18px] ${className}`}
      style={{
        background: PANEL,
        border: `2px solid ${GREEN}`,
        boxShadow: highlighted ? '0 0 30px rgba(46,224,106,.32)' : '0 0 22px rgba(46,224,106,.16)',
      }}
    >{children}</div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
      {children}
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <>
      <h4 className="mb-2 mt-6 text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.5)' }}>{q}</h4>
      <div
        className="rounded-2xl px-5 py-4 text-center font-bold"
        style={{ background: PANEL, border: `2px solid ${GREEN}` }}
      >{a}</div>
    </>
  );
}

function Carousel({ images }: { images: string[] }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((prev) => (prev + d + images.length) % images.length);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setI((prev) => (prev + 1) % images.length), 6000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[18px]" style={{ background: PANEL }}>
        <span
          className="absolute right-3.5 top-3.5 z-10 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold tracking-wider text-white"
          style={{ background: GREEN }}
        >🍀 PREMIO EXCLUSIVO</span>

        {images.length ? (
          <img src={images[i]} alt="Premio" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-[13px]" style={{ color: 'rgba(255,255,255,.4)' }}>
            Cargá las fotos del premio desde el panel del CRM (pestaña Sorteo → Configuración)
          </div>
        )}

        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Anterior" className="absolute left-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white" style={{ background: 'rgba(0,0,0,.6)' }}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Siguiente" className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white" style={{ background: 'rgba(0,0,0,.6)' }}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3.5 flex justify-center gap-2">
          {images.map((_, j) => (
            <button
              key={j} onClick={() => setI(j)} aria-label={`Foto ${j + 1}`}
              className="h-2 w-2 rounded-full"
              style={{ background: j === i ? GREEN : '#2c4436' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------- comprar ----------------------------

function BuyModal({ pkg, data, onClose }: { pkg: Pkg; data: PublicSorteo; onClose: () => void }) {
  const [form, setForm] = useState({ buyerName: '', buyerEmail: '', buyerPhone: '', holderName: '' });
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; orderNumber: string } | null>(null);

  const submit = async () => {
    if (form.buyerName.trim().length < 3) { setError('Escribí tu nombre completo'); return; }
    if (!form.buyerEmail.trim() && !form.buyerPhone.trim()) { setError('Dejanos un email o un WhatsApp'); return; }
    setBusy(true); setError(null);
    try {
      const order = await api.createSorteoOrder({
        packageId: pkg.id,
        buyerName: form.buyerName.trim(),
        buyerEmail: form.buyerEmail.trim() || undefined,
        buyerPhone: form.buyerPhone.trim() || undefined,
        holderName: form.holderName.trim() || undefined,
      });
      // El comprobante se sube después: recién con la compra creada tenemos el id que
      // habilita la subida.
      if (file) {
        const receiptUrl = await uploadSorteoReceipt(file, order.id);
        await api.attachSorteoReceipt(order.id, { receiptUrl, holderName: form.holderName.trim() || undefined });
      }
      setDone({ id: order.id, orderNumber: order.orderNumber });
    } catch (e: any) {
      setError(e?.message || 'No pudimos registrar tu compra, probá de nuevo');
    } finally { setBusy(false); }
  };

  const waLink = `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(
    `Hola! Compré ${pkg.chances} chances (${money(pkg.price)}). Mi orden es ${done?.orderNumber ?? ''}`,
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 grid overflow-y-auto p-5"
      style={{ background: 'rgba(0,0,0,.8)', placeItems: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[430px] rounded-2xl p-6" style={{ background: '#0a1610', border: `1px solid ${LINE}` }}>
        <button onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-3" style={{ color: 'rgba(255,255,255,.5)' }}>
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="text-center">
            <div className="text-[44px]">✅</div>
            <h3 className="text-[24px] font-black" style={{ color: WHATSAPP }}>¡Listo!</h3>
            <p className="my-3 text-[14px]" style={{ color: 'rgba(255,255,255,.6)' }}>
              Tu compra <b style={{ color: '#fff' }}>{done.orderNumber}</b> quedó registrada. Apenas verificamos la
              transferencia te asignamos tus {pkg.chances} números y te avisamos.
            </p>
            <a
              href={waLink} target="_blank" rel="noopener noreferrer"
              className="block rounded-lg px-5 py-3 font-bold text-white"
              style={{ background: WHATSAPP }}
            >Avisar por WhatsApp</a>
          </div>
        ) : (
          <>
            <h3 className="text-center text-[24px] font-black uppercase">Completá tu compra</h3>
            <p className="text-center text-[13px]" style={{ color: 'rgba(255,255,255,.55)' }}>
              Transferí y cargá el comprobante
            </p>

            <div className="my-4 rounded-[10px] p-3.5 text-center" style={{ background: '#14251b' }}>
              <div className="text-[12px]" style={{ color: 'rgba(255,255,255,.55)' }}>Total a transferir</div>
              <div className="text-[34px] font-black" style={{ color: GREEN }}>{money(pkg.price)}</div>
              <div className="text-[12px]" style={{ color: 'rgba(255,255,255,.55)' }}>{pkg.chances} chances</div>
            </div>

            <div className="mb-4 rounded-[10px] p-3.5" style={{ border: `1px solid ${LINE}` }}>
              <label className="mb-2 block text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.5)' }}>Alias</label>
              <div className="flex gap-2.5">
                <code
                  className="flex-1 rounded-lg px-3.5 py-2.5 font-bold"
                  style={{ background: '#14251b', border: `1px solid ${LINE}`, color: GREEN }}
                >{data.paymentAlias}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(data.paymentAlias); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold text-white"
                  style={{ border: `1px solid ${GREEN}` }}
                >{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copiado' : 'Copiar'}</button>
              </div>
              {data.paymentHolder && (
                <p className="mt-2 text-[12px]" style={{ color: 'rgba(255,255,255,.5)' }}>Titular: {data.paymentHolder}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Field placeholder="Nombre completo *" value={form.buyerName} onChange={(v) => setForm({ ...form, buyerName: v })} />
              <Field placeholder="Email (recibís tus números acá)" type="email" value={form.buyerEmail} onChange={(v) => setForm({ ...form, buyerEmail: v })} />
              <Field placeholder="WhatsApp — ej: 1139554443" value={form.buyerPhone} onChange={(v) => setForm({ ...form, buyerPhone: v })} />
              <Field placeholder="Titular de la cuenta que transfirió (opcional)" value={form.holderName} onChange={(v) => setForm({ ...form, holderName: v })} />

              <label
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-bold text-white"
                style={{ background: WHATSAPP }}
              >
                <Upload className="h-4 w-4" />
                {file ? file.name.slice(0, 28) : 'SUBÍ EL COMPROBANTE (opcional)'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            {error && <p className="mt-2.5 text-[13.5px]" style={{ color: '#ffb4a2' }}>{error}</p>}

            <div className="mt-4 flex gap-2.5">
              <button onClick={onClose} className="flex-1 rounded-lg py-2.5 font-bold" style={{ border: `1px solid ${LINE}`, color: 'rgba(255,255,255,.7)' }}>
                Cancelar
              </button>
              <button
                onClick={submit} disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-white disabled:opacity-50"
                style={{ background: GREEN }}
              >{busy && <Loader2 className="h-4 w-4 animate-spin" />} Finalizar compra</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ placeholder, value, onChange, type = 'text' }: { placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3.5 py-2.5 text-[15px] outline-none"
      style={{ background: '#14251b', border: `1px solid ${LINE}`, color: '#f2f2f5' }}
    />
  );
}

// -------------------------- mis números --------------------------

const STATUS_TEXT: Record<string, string> = {
  PENDIENTE: 'Estamos verificando tu transferencia. Apenas la confirmemos te asignamos los números.',
  APROBADO: '',
  RECHAZADO: 'No pudimos verificar esta transferencia. Escribinos por WhatsApp.',
};

function Consulta() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (q.trim().length < 5) return;
    setBusy(true);
    try { setRows(await api.sorteoLookup(q.trim())); }
    catch { setRows([]); }
    finally { setBusy(false); }
  };

  return (
    <section id="consulta" className="py-14">
      <h2 className="mb-2 text-center text-[clamp(26px,4vw,42px)] font-black">Consultá tus números</h2>
      <p className="mb-6 text-center text-[14px]" style={{ color: 'rgba(255,255,255,.55)' }}>
        Buscá con el mismo email o WhatsApp que usaste al comprar
      </p>

      <div className="mx-auto flex max-w-[520px] flex-wrap justify-center gap-2.5">
        <input
          placeholder="Email o teléfono" value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="min-w-0 flex-1 rounded-lg px-3.5 py-2.5 text-[15px] outline-none"
          style={{ background: '#14251b', border: `1px solid ${LINE}`, color: '#f2f2f5' }}
        />
        <button
          onClick={search} disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-bold text-white disabled:opacity-50"
          style={{ background: GREEN_DARK }}
        >{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Consultar</button>
      </div>

      {rows && !rows.length && (
        <p className="mt-6 text-center text-[14px]" style={{ color: 'rgba(255,255,255,.55)' }}>
          No encontramos compras con ese dato. Tiene que ser el mismo email o teléfono que cargaste al comprar.
        </p>
      )}

      <div className="mx-auto mt-8 max-w-[560px] space-y-5">
        {rows?.map((o) => (
          <div key={o.id} className="rounded-md p-6" style={{ background: '#fff', color: '#111', border: '3px solid #111' }}>
            <h3 className="mb-4 border-b-[3px] pb-2.5 text-center text-[22px] font-black" style={{ borderColor: GOLD }}>
              COMPROBANTE DE COMPRA
            </h3>
            <p className="mb-3">¡Estás participando por una <b>{o.prize}</b>!</p>
            <p className="text-[15px]"><b>Comprador:</b> {o.buyerName}</p>
            <p className="text-[15px]"><b>Total de Chances:</b> {o.chances}</p>
            <p className="text-[15px]"><b>Total Pagado:</b> <span style={{ color: '#16a34a' }}>{money(o.amount)}</span></p>

            {o.numbers.length ? (
              <>
                <p className="mt-3 font-bold">Tus Números:</p>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {o.numbers.map((n: number) => (
                    <span key={n} className="rounded-md px-4 py-2 text-[18px] font-extrabold" style={{ background: GOLD }}>{n}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 rounded-md p-2.5 text-center font-bold" style={{ background: '#fff3cd', border: '1px solid #e0b400' }}>
                {STATUS_TEXT[o.status] || ''}
              </p>
            )}

            <p className="mt-4 text-center text-[12px]" style={{ color: '#666' }}>
              Compra {o.orderNumber} · {new Date(o.createdAt).toLocaleDateString('es-AR')}
            </p>
            <p className="text-center font-semibold">Mucha suerte y siempre con fe!</p>
          </div>
        ))}
      </div>
    </section>
  );
}
