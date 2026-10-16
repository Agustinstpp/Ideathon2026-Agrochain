import Link from "next/link";
import "@/components/ui/agrochain.css";
import { Logo } from "@/components/ui/Logo";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata = {
  title: "AgroChain FeedTrace",
  description: "Registro de la alimentación de cada lote ganadero, con pasaporte digital por QR.",
};

const STEPS: { n: string; title: string; text: string; brown?: boolean }[] = [
  { n: "1", title: "Cargá el alimento", text: "Registrás el lote de grano: cultivo, cantidad y campo de origen." },
  { n: "2", title: "Registrá la alimentación", text: "Asignás kilos de ese grano a un lote de animales. El saldo se descuenta solo y no se puede pasar.", brown: true },
  { n: "3", title: "Compartí el pasaporte", text: "El comprador escanea el QR y ve origen e historial. Sin cuenta ni billetera." },
];

const PASSPORT: { icon: IconName; title: string; text: string; tone?: "dark" | "brown" }[] = [
  { icon: "cattle", title: "Lote", text: "Código, cantidad de animales y establecimiento.", tone: "dark" },
  { icon: "grain", title: "Alimentación", text: "Qué grano recibió, cuántos kilos y en qué período." },
  { icon: "check", title: "Saldo controlado", text: "No se puede asignar más grano del que hay." },
  { icon: "qr", title: "Comprobante", text: "Cada registro tiene una referencia verificable.", tone: "brown" },
];

const WHO = [
  { tag: "CARGA LOS DATOS", title: "Productor o feedlot", text: "Formularios cortos, desde el celular." },
  { tag: "CONSULTA", title: "Comprador o frigorífico", text: "Abre el pasaporte del lote con un QR." },
  { tag: "PROVEE", title: "Proveedor de alimento", text: "Su lote queda vinculado al ganado que lo consumió." },
];

export default function LandingPage() {
  return (
    <div className="ag landing">
      <div className="landing-wrap">
        <header className="hero">
          <nav className="topnav" aria-label="Principal">
            <Link href="/inicio" className="brand">
              <Logo />
              <span className="brand-name">
                AgroChain <span>FeedTrace</span>
              </span>
            </Link>
            <div className="navlinks">
              <a className="navlink" href="#como">Cómo funciona</a>
              <a className="navlink" href="#pasaporte">Pasaporte</a>
              <a className="navlink" href="#para-quien">Para quién</a>
            </div>
            <Link className="btn small" href="/dashboard">
              Ingresar
            </Link>
          </nav>

          <div className="hero-body">
            <div className="hero-text">
              <span className="hero-tag">Trazabilidad ganadera · NEA</span>
              <h1>
                Qué comió cada lote, <span>registrado y verificable.</span>
              </h1>
              <p>Vinculamos cada lote de grano con el ganado que lo consumió y lo mostramos en un pasaporte por QR.</p>
              <div className="actions">
                <Link className="btn gold" href="/dashboard">
                  Ingresar al panel
                </Link>
                <a className="btn ghost" href="#como">
                  Cómo funciona
                </a>
              </div>
            </div>

            <div className="hero-card" aria-label="Ejemplo de pasaporte">
              <span className="mono xsmall muted">LOTE GANADERO</span>
              <strong className="hero-code">GAN-001</strong>
              <span className="small muted">20 animales · Mercedes, Corrientes</span>
              <div className="hero-ok">
                <span className="hero-ok-icon">
                  <Icon name="check" size={18} />
                </span>
                <span>
                  <strong>2.000 kg de maíz</strong>
                  <span className="xsmall">Lote AGR-001 · quedan 8.000 kg</span>
                </span>
              </div>
              <span className="badge sim" style={{ alignSelf: "flex-start" }}>
                Datos de ejemplo
              </span>
            </div>
          </div>
        </header>

        <section id="como" className="l-section">
          <h2 className="l-title">Cómo funciona</h2>
          <div className="l-grid">
            {STEPS.map((s) => (
              <article key={s.n} className="card l-card">
                <span className={`l-num ${s.brown ? "brown" : ""}`}>{s.n}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pasaporte" className="l-section">
          <h2 className="l-title">Qué muestra el pasaporte</h2>
          <div className="l-grid four">
            {PASSPORT.map((p) => (
              <div key={p.title} className={`card l-feature ${p.tone || ""}`}>
                <Icon name={p.icon} size={28} />
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="para-quien" className="l-section">
          <h2 className="l-title">Para quién es</h2>
          <div className="l-grid">
            {WHO.map((w) => (
              <article key={w.title} className="card l-card">
                <span className="l-kicker">{w.tag}</span>
                <h3>{w.title}</h3>
                <p className="muted">{w.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="l-limits">
          <div className="l-limits-head">
            <h2>Qué garantiza y qué no</h2>
          </div>
          <div className="card">
            <strong className="ok-text">Garantiza</strong>
            <ul>
              <li>Que los registros no se modificaron después de cargarse.</li>
              <li>Que no se asignó más grano del disponible.</li>
            </ul>
          </div>
          <div className="card">
            <strong className="warn-text">No reemplaza</strong>
            <ul>
              <li>Una certificación oficial.</li>
              <li>El control de que lo declarado pasó en el campo.</li>
            </ul>
          </div>
        </section>

        <footer className="l-footer">
          <span className="brand-name">
            AgroChain <span>FeedTrace</span>
          </span>
          <span className="small muted">Ideathon NEA Tech 2026 · Desafío 01</span>
          <span className="small muted">Demo con datos simulados</span>
        </footer>
      </div>
    </div>
  );
}
