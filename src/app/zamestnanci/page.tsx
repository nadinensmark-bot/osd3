"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import type { Employee, Pohlavi } from "@/lib/types";
import { nactiJmena, ulozJmeno, type Jmeno } from "@/lib/names";

export default function Zamestnanci() {
  const supabase = createClient();
  const [uid, setUid] = useState<string | null>(null);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [jmena, setJmena] = useState<Record<string, Jmeno>>({});
  const [nacita, setNacita] = useState(true);
  const [hromadne, setHromadne] = useState("");
  const [zobrazImport, setZobrazImport] = useState(false);

  async function nacti() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setUid(u.user.id);
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("aktivni", true)
      .order("created_at");
    setEmps((data as Employee[]) || []);
    setJmena(nactiJmena());
    setNacita(false);
  }

  useEffect(() => {
    nacti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dalsiKod(existujici: Employee[]): string {
    let n = 1;
    const kody = new Set(existujici.map((e) => e.kod));
    while (kody.has("ZAM" + n)) n++;
    return "ZAM" + n;
  }

  async function pridej(pohlavi: Pohlavi = "zena") {
    if (!uid) return;
    const kod = dalsiKod(emps);
    const { data } = await supabase
      .from("employees")
      .insert({ user_id: uid, kod, pohlavi })
      .select()
      .single();
    if (data) setEmps([...emps, data as Employee]);
  }

  async function importuj() {
    if (!uid) return;
    const radky = hromadne
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    let aktualni = [...emps];
    const novaJmena = { ...jmena };
    for (const cele of radky) {
      const kod = dalsiKod(aktualni);
      const { data } = await supabase
        .from("employees")
        .insert({ user_id: uid, kod, pohlavi: "zena" })
        .select()
        .single();
      if (data) {
        aktualni = [...aktualni, data as Employee];
        const krestni = cele.split(/\s+/)[0] || cele;
        const j: Jmeno = { cele, krestni, osloveni: "paní" };
        ulozJmeno((data as Employee).id, j);
        novaJmena[(data as Employee).id] = j;
      }
    }
    setEmps(aktualni);
    setJmena(novaJmena);
    setHromadne("");
    setZobrazImport(false);
  }

  async function uprav(id: string, patch: Partial<Employee>) {
    await supabase.from("employees").update(patch).eq("id", id);
    setEmps(emps.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function deaktivuj(id: string) {
    await supabase.from("employees").update({ aktivni: false }).eq("id", id);
    setEmps(emps.filter((e) => e.id !== id));
  }

  function nastavJmeno(id: string, patch: Partial<Jmeno>, pohlavi: Pohlavi) {
    const soucasne = jmena[id] || {
      cele: "",
      krestni: "",
      osloveni: pohlavi === "muz" ? "pan" : "paní",
    };
    const nove = { ...soucasne, ...patch };
    ulozJmeno(id, nove);
    setJmena({ ...jmena, [id]: nove });
  }

  if (nacita)
    return (
      <AppShell>
        <p style={{ color: "var(--muted)" }}>Načítám...</p>
      </AppShell>
    );

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Zaměstnanci</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setZobrazImport(!zobrazImport)}>
            Hromadně vložit
          </button>
          <button className="btn btn-primary" onClick={() => pridej()}>
            + Přidat
          </button>
        </div>
      </div>
      <p style={{ color: "var(--muted)", marginBottom: 20 }}>
        Jména vidíš jen ty, ukládají se do tohoto prohlížeče. Na server jde jen
        kód (ZAM1...).
      </p>

      {zobrazImport && (
        <div className="card" style={{ marginBottom: 20 }}>
          <label className="label">
            Vlož seznam, jedno jméno na řádek. Každému se přiřadí kód. Pohlaví a
            pozici případně uprav v tabulce.
          </label>
          <textarea
            className="textarea"
            rows={6}
            value={hromadne}
            onChange={(e) => setHromadne(e.target.value)}
            placeholder={"Sandra Andrýsková\nLazaro Castaner\n..."}
          />
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={importuj}>
            Importovat {hromadne.split("\n").filter((r) => r.trim()).length || ""}
          </button>
        </div>
      )}

      {emps.length === 0 ? (
        <div className="card" style={{ color: "var(--muted)" }}>
          Zatím nikdo. Přidej zaměstnance tlačítkem výše.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {emps.map((e) => {
            const j = jmena[e.id];
            return (
              <div key={e.id} className="card" style={{ padding: "1rem 1.1rem" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "var(--navy)",
                      color: "#fff",
                      padding: "0.15rem 0.6rem",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: "0.82rem",
                    }}
                  >
                    {e.kod}
                  </span>
                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 180 }}
                    placeholder="Celé jméno (jen u tebe)"
                    defaultValue={j?.cele || ""}
                    onBlur={(ev) => {
                      const cele = ev.target.value.trim();
                      nastavJmeno(
                        e.id,
                        { cele, krestni: (jmena[e.id]?.krestni || cele.split(/\s+/)[0] || "") },
                        e.pohlavi,
                      );
                    }}
                  />
                  <button
                    className="btn btn-ghost"
                    onClick={() => deaktivuj(e.id)}
                    title="Odebrat"
                  >
                    Odebrat
                  </button>
                </div>
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1.3fr 1fr 1fr 1.2fr" }}>
                  <div>
                    <label className="label">Oslovení v textu</label>
                    <input
                      className="input"
                      defaultValue={j?.krestni || ""}
                      placeholder="Sandra"
                      onBlur={(ev) => nastavJmeno(e.id, { krestni: ev.target.value.trim() }, e.pohlavi)}
                    />
                  </div>
                  <div>
                    <label className="label">Pohlaví</label>
                    <select
                      className="select"
                      value={e.pohlavi}
                      onChange={(ev) => {
                        const p = ev.target.value as Pohlavi;
                        uprav(e.id, { pohlavi: p });
                        nastavJmeno(e.id, { osloveni: p === "muz" ? "pan" : "paní" }, p);
                      }}
                    >
                      <option value="zena">žena (paní)</option>
                      <option value="muz">muž (pan)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">V domově</label>
                    <input
                      className="input"
                      defaultValue={e.nastup}
                      placeholder="od 2022"
                      onBlur={(ev) => uprav(e.id, { nastup: ev.target.value.trim() })}
                    />
                  </div>
                  <div>
                    <label className="label">Pozice</label>
                    <input
                      className="input"
                      defaultValue={e.pozice}
                      placeholder="pečovatelka"
                      onBlur={(ev) => uprav(e.id, { pozice: ev.target.value.trim() })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
