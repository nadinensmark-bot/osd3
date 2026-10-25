"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { DEFAULT_KATEGORIE } from "@/lib/types";

interface RoundRow {
  id: string;
  obdobi: string;
  created_at: string;
  pocet: number;
}

export default function Home() {
  const supabase = createClient();
  const [nacita, setNacita] = useState(true);
  const [pocetZam, setPocetZam] = useState(0);
  const [maNastaveni, setMaNastaveni] = useState(false);
  const [rounds, setRounds] = useState<RoundRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      // zajisti řádek nastavení s výchozími kategoriemi
      const { data: s } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (!s) {
        await supabase.from("settings").insert({
          user_id: u.user.id,
          kategorie: DEFAULT_KATEGORIE,
        });
        setMaNastaveni(false);
      } else {
        setMaNastaveni(Boolean(s.schvalila));
      }

      const { count } = await supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("aktivni", true);
      setPocetZam(count || 0);

      const { data: r } = await supabase
        .from("rounds")
        .select("id, obdobi, created_at")
        .order("created_at", { ascending: false });
      const list: RoundRow[] = [];
      for (const row of r || []) {
        const { count: c } = await supabase
          .from("evaluations")
          .select("id", { count: "exact", head: true })
          .eq("round_id", row.id);
        list.push({ ...row, pocet: c || 0 });
      }
      setRounds(list);
      setNacita(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 6 }}>
        Přehled
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Čtvrtletní hodnocení a návrhy odměn. Jména zaměstnanců zůstávají jen v
        tomhle prohlížeči.
      </p>

      {nacita ? (
        <p style={{ color: "var(--muted)" }}>Načítám...</p>
      ) : (
        <>
          {(pocetZam === 0 || !maNastaveni) && (
            <div
              className="card"
              style={{
                marginBottom: 20,
                borderColor: "var(--bordo)",
                background: "#fcf5f5",
              }}
            >
              <strong>Než začneš, dvě věci:</strong>
              <ol style={{ margin: "10px 0 0 18px", lineHeight: 1.9 }}>
                <li>
                  {maNastaveni ? "✓ " : ""}Vyplň{" "}
                  <Link href="/nastaveni" style={{ color: "var(--navy)" }}>
                    nastavení
                  </Link>{" "}
                  (kdo navrhuje a schvaluje, místo).
                </li>
                <li>
                  {pocetZam > 0 ? "✓ " : ""}Přidej{" "}
                  <Link href="/zamestnanci" style={{ color: "var(--navy)" }}>
                    zaměstnance
                  </Link>{" "}
                  (kódy + jména zůstanou u tebe v prohlížeči).
                </li>
              </ol>
            </div>
          )}

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
            <StatCard label="Aktivní zaměstnanci" value={String(pocetZam)} href="/zamestnanci" />
            <StatCard label="Proběhlá kola" value={String(rounds.length)} href="/kolo" />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Kola hodnocení</h2>
            <Link href="/kolo" className="btn btn-primary">
              + Nové kolo
            </Link>
          </div>

          {rounds.length === 0 ? (
            <div className="card" style={{ color: "var(--muted)" }}>
              Zatím žádné kolo. Až přidáš zaměstnance, založ první čtvrtletní
              kolo tlačítkem „Nové kolo".
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {rounds.map((r) => (
                <Link
                  key={r.id}
                  href={`/kolo/${r.id}`}
                  className="card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "var(--text)",
                  }}
                >
                  <div>
                    <strong>{r.obdobi}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {new Date(r.created_at).toLocaleDateString("cs-CZ")}
                    </div>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    {r.pocet} hodnocení →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="card"
      style={{ flex: 1, minWidth: 180, textDecoration: "none", color: "var(--text)" }}
    >
      <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--navy)" }}>
        {value}
      </div>
      <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{label}</div>
    </Link>
  );
}
