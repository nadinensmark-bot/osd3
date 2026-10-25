"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ODKAZY = [
  { href: "/", label: "Přehled" },
  { href: "/zamestnanci", label: "Zaměstnanci" },
  { href: "/kolo", label: "Hodnocení" },
  { href: "/nastaveni", label: "Nastavení" },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function odhlasit() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      style={{
        background: "var(--navy)",
        color: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          minHeight: 58,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 700, letterSpacing: 0.3 }}>OŠD Praha 3</span>
        <nav style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
          {ODKAZY.map((o) => {
            const aktiv =
              o.href === "/" ? path === "/" : path.startsWith(o.href);
            return (
              <Link
                key={o.href}
                href={o.href}
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  padding: "0.4rem 0.75rem",
                  borderRadius: 8,
                  fontSize: "0.92rem",
                  fontWeight: aktiv ? 700 : 500,
                  background: aktiv ? "rgba(255,255,255,0.16)" : "transparent",
                }}
              >
                {o.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={odhlasit}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#fff",
            padding: "0.35rem 0.8rem",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "0.88rem",
          }}
        >
          Odhlásit
        </button>
      </div>
    </header>
  );
}
