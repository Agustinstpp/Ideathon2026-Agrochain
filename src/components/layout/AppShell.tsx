"use client";
import "@/components/ui/agrochain.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getMode, isSimulated, resetDemo } from "@/components/ui/data/client";
import { Logo } from "@/components/ui/Logo";
import { Icon, type IconName } from "@/components/ui/Icon";

const LINKS: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Inicio", short: "Inicio", icon: "home" },
  { href: "/lotes/agricolas", label: "Alimento", short: "Alimento", icon: "grain" },
  { href: "/lotes/ganaderos", label: "Animales", short: "Animales", icon: "cattle" },
  { href: "/alimentacion", label: "Registrar alimentación", short: "Alimentar", icon: "feed" },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(href + "/");
}

export function Sidebar() {
  const path = usePathname();
  return (
    <nav className="topnav" aria-label="Principal">
      <Link href="/dashboard" className="brand">
        <Logo />
        <span className="brand-name">
          AgroChain <span>FeedTrace</span>
        </span>
      </Link>
      <div className="navlinks">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`navlink ${isActive(path, l.href) ? "active" : ""}`}>
            {l.label}
          </Link>
        ))}
      </div>
      <span className="org">Usuario demo</span>
    </nav>
  );
}

export function MobileNavigation() {
  const path = usePathname();
  return (
    <nav className="bottomnav" aria-label="Principal (celular)">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={isActive(path, l.href) ? "active" : ""}>
          <Icon name={l.icon} size={22} />
          {l.short}
        </Link>
      ))}
    </nav>
  );
}

function DemoBanner() {
  const [demo, setDemo] = useState(false);
  const [local, setLocal] = useState(false);
  useEffect(() => {
    isSimulated().then(setDemo);
    getMode().then((m) => setLocal(m === "demo"));
  }, []);
  if (!demo) return null;
  return (
    <div className="demo-banner" role="note">
      <Icon name="alert" size={18} />
      <span>
        <strong>Modo demostración</strong> · datos simulados, sin registro verificable.
      </span>
      {local && (
        <button
          type="button"
          className="btn secondary small"
          style={{ marginLeft: "auto" }}
          onClick={() => {
            resetDemo();
            window.location.reload();
          }}
        >
          Reiniciar demo
        </button>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ag shell">
      <div className="container">
        <Sidebar />
        <DemoBanner />
        <main className="page">{children}</main>
      </div>
      <MobileNavigation />
    </div>
  );
}
