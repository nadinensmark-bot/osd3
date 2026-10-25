"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { DEFAULT_KATEGORIE } from "@/lib/types";

export default function Nastaveni() {
  const supabase = createClient();
  const [nacita, setNacita] = useState(true);
  const [ulozeno, setUlozeno] = useState(false);
  const [kategorie, setKategorie] = useState<string[]>(DEFAULT_KATEGORIE);
  const [navrhla, setNavrhla] = useState("");
  const [navrhlaFunkce, setNavrhlaFunkce] = useState("Vrchní sestra");
  const [schvalila, setSchvalila] = useState("");
  const [schvalilaFunkce, setSchvalilaFunkce] = useState("Ředitelka");
  const [misto, setMisto] = useState("Praha");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (data) {
        setKategorie(data.kategorie?.length ? data.kategorie : DEFAULT_KATEGORIE);
        setNavrhla(data.navrhla || "");
        setNavrhlaFunkce(data.navrhla_funkce || "Vrchní sestra");
        setSchvalila(data.schvalila || "");
        setSchvalilaFunkce(data.schvalila_funkce || "Ředitelka");
        setMisto(data.misto || "Praha");
      }
      setNacita(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uloz() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("settings").upsert({
      user_id: u.user.id,
      kategorie: kategorie.map((k) => k.trim()).filter(Boolean),
      navrhla,
      navrhla_funkce: navrhlaFunkce,
      schvalila,
      schvalila_funkce: schvalilaFunkce,
      misto,
      updated_at: new Date().toISOString(),
    });
    setUlozeno(true);
    setTimeout(() => setUlozeno(false), 2500);
  }

  if (nacita)
    return (
      <AppShell>
        <p style={{ color: "var(--muted)" }}>Načítám...</p>
      </AppShell>
    );

  return (
    <AppShell>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 6 }}>
        Nastavení
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Tyhle údaje se doplní do každého vygenerovaného návrhu.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 14 }}>Podpisy na dokumentu</h2>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label className="label">Navrhuje (jméno)</label>
            <input className="input" value={navrhla} onChange={(e) => setNavrhla(e.target.value)} placeholder="Mgr. Jana Nováková" />
          </div>
          <div>
            <label className="label">Funkce navrhující</label>
            <input className="input" value={navrhlaFunkce} onChange={(e) => setNavrhlaFunkce(e.target.value)} />
          </div>
          <div>
            <label className="label">Schvaluje (jméno)</label>
            <input className="input" value={schvalila} onChange={(e) => setSchvalila(e.target.value)} placeholder="Mgr. Petra ...," />
          </div>
          <div>
            <label className="label">Funkce schvalující</label>
            <input className="input" value={schvalilaFunkce} onChange={(e) => setSchvalilaFunkce(e.target.value)} />
          </div>
          <div>
            <label className="label">Místo (do „V ... dne")</label>
            <input className="input" value={misto} onChange={(e) => setMisto(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 6 }}>Kategorie hodnocení</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 14 }}>
          Nadpisy, které se objeví v každém hodnocení. Můžeš upravit, přidat
          nebo ubrat.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {kategorie.map((k, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={k}
                onChange={(e) => {
                  const c = [...kategorie];
                  c[i] = e.target.value;
                  setKategorie(c);
                }}
              />
              <button
                className="btn btn-ghost"
                onClick={() => setKategorie(kategorie.filter((_, j) => j !== i))}
                title="Odebrat"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn btn-ghost"
          style={{ marginTop: 10 }}
          onClick={() => setKategorie([...kategorie, ""])}
        >
          + Přidat kategorii
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button className="btn btn-primary" onClick={uloz}>
          Uložit nastavení
        </button>
        {ulozeno && <span style={{ color: "green", fontSize: "0.9rem" }}>Uloženo ✓</span>}
      </div>
    </AppShell>
  );
}
