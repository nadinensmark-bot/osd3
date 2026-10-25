"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Rating from "./Rating";
import {
  type Answers,
  type Employee,
  type Generated,
  type Settings,
  STITKY,
  prazdneOdpovedi,
} from "@/lib/types";
import { jmeno, dosadJmeno } from "@/lib/names";
import { exportDocx } from "@/lib/docx";

interface Props {
  uid: string;
  roundId: string;
  obdobi: string;
  settings: Settings;
  employee: Employee;
  evaluationId: string | null;
  initAnswers: Answers;
  initGenerated: Generated | null;
  initReward: string | null;
  minuleKategorie?: { nadpis: string; text: string }[];
  minuleCile?: string[];
  onStav: (status: "rozpracovano" | "hotovo") => void;
}

export default function EvalEditor(props: Props) {
  const supabase = createClient();
  const [answers, setAnswers] = useState<Answers>(props.initAnswers || prazdneOdpovedi());
  const [gen, setGen] = useState<Generated | null>(props.initGenerated);
  const [reward, setReward] = useState(props.initReward || "");
  const [evalId, setEvalId] = useState(props.evaluationId);
  const [generuji, setGeneruji] = useState(false);
  const [chyba, setChyba] = useState("");
  const [instrukce, setInstrukce] = useState("");
  const [ulozeno, setUlozeno] = useState(false);

  const j = jmeno(props.employee.id);
  const zobrazeniJmeno = j ? dosadJmeno("{{celeJmeno}}", j) : props.employee.kod;

  function setA<K extends keyof Answers>(k: K, v: Answers[K]) {
    setAnswers({ ...answers, [k]: v });
  }

  async function ulozDB(patch: { answers?: Answers; generated?: Generated | null; reward_amount?: string; status?: string }) {
    const base = {
      user_id: props.uid,
      round_id: props.roundId,
      employee_id: props.employee.id,
      updated_at: new Date().toISOString(),
    };
    if (evalId) {
      await supabase.from("evaluations").update({ ...patch, updated_at: base.updated_at }).eq("id", evalId);
    } else {
      const { data } = await supabase
        .from("evaluations")
        .insert({ ...base, answers, generated: gen, reward_amount: reward, status: "rozpracovano", ...patch })
        .select()
        .single();
      if (data) setEvalId(data.id);
    }
  }

  async function ulozOdpovedi() {
    await ulozDB({ answers, status: "rozpracovano" });
    props.onStav("rozpracovano");
    setUlozeno(true);
    setTimeout(() => setUlozeno(false), 2000);
  }

  async function generuj(withInstrukce = false) {
    setGeneruji(true);
    setChyba("");
    try {
      const body = {
        obdobi: props.obdobi,
        pozice: props.employee.pozice,
        pohlavi: props.employee.pohlavi,
        nastup: props.employee.nastup,
        kategorie: props.settings.kategorie,
        answers,
        minuleKategorie: props.minuleKategorie,
        minuleCile: props.minuleCile,
        instrukce: withInstrukce ? instrukce : undefined,
        predchoziVystup: withInstrukce ? gen || undefined : undefined,
      };
      const res = await fetch("/api/generovat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba generování.");
      setGen(data.generated);
      await ulozDB({ answers, generated: data.generated, status: "rozpracovano" });
      props.onStav("rozpracovano");
      if (withInstrukce) setInstrukce("");
    } catch (e) {
      setChyba(e instanceof Error ? e.message : "Chyba.");
    } finally {
      setGeneruji(false);
    }
  }

  async function oznacHotovo() {
    await ulozDB({ answers, generated: gen, reward_amount: reward, status: "hotovo" });
    props.onStav("hotovo");
  }

  async function stahni() {
    if (!gen) return;
    await ulozDB({ reward_amount: reward });
    await exportDocx({
      generated: gen,
      jmeno: j,
      kod: props.employee.kod,
      pozice: props.employee.pozice,
      obdobi: props.obdobi,
      settings: props.settings,
      rewardAmount: reward,
      datum: new Date().toLocaleDateString("cs-CZ"),
    });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ background: "var(--navy)", color: "#fff", padding: "0.15rem 0.6rem", borderRadius: 6, fontWeight: 700, fontSize: "0.82rem" }}>
          {props.employee.kod}
        </span>
        <strong style={{ fontSize: "1.15rem" }}>{zobrazeniJmeno}</strong>
      </div>
      {!j && (
        <p style={{ color: "var(--bordo)", fontSize: "0.82rem", marginBottom: 10 }}>
          Tento kód nemá u tebe přiřazené jméno. Doplň ho v sekci Zaměstnanci, jinak bude ve Wordu jen kód.
        </p>
      )}

      {/* DOTAZNÍK */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Jak to šlo za toto období?</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <Rating label="Přístup ke klientům" value={answers.klienti} onChange={(v) => setA("klienti", v)} />
          <Rating label="Práce v IS CYGNUS II" value={answers.cygnus} onChange={(v) => setA("cygnus", v)} />
          <Rating label="Spolupráce v týmu" value={answers.tym} onChange={(v) => setA("tym", v)} />
          <Rating label="Efektivita a samostatnost" value={answers.efektivita} onChange={(v) => setA("efektivita", v)} />
          <Rating label="Spokojenost klientů / zpětná vazba" value={answers.zpetnaVazba} onChange={(v) => setA("zpetnaVazba", v)} />
          <Rating label="Zvládání češtiny / jazyk" value={answers.jazyk} onChange={(v) => setA("jazyk", v)} />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, cursor: "pointer" }}>
          <input type="checkbox" checked={answers.klicovyPracovnik} onChange={(e) => setA("klicovyPracovnik", e.target.checked)} />
          <span>Je klíčový pracovník</span>
        </label>

        <div style={{ marginTop: 16 }}>
          <label className="label">Rychlé postřehy (klikni, co sedí)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {STITKY.map((s) => {
              const on = answers.stitky.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setA("stitky", on ? answers.stitky.filter((x) => x !== s) : [...answers.stitky, s])
                  }
                  style={{
                    padding: "0.3rem 0.7rem",
                    borderRadius: 20,
                    border: "1px solid " + (on ? "var(--navy)" : "var(--line)"),
                    background: on ? "var(--navy)" : "#fff",
                    color: on ? "#fff" : "var(--muted)",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="label">Cokoliv dalšího (nepovinné)</label>
          <textarea
            className="textarea"
            value={answers.poznamka}
            onChange={(e) => setA("poznamka", e.target.value)}
            placeholder="Např. vrátila se z mateřské, výborně zaskočila přes léto..."
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={ulozOdpovedi}>Uložit odpovědi</button>
          <button className="btn btn-primary" onClick={() => generuj(false)} disabled={generuji}>
            {generuji ? "Generuji..." : gen ? "Vygenerovat znovu" : "Vygenerovat hodnocení"}
          </button>
          {ulozeno && <span style={{ color: "green", fontSize: "0.85rem" }}>Uloženo ✓</span>}
          {chyba && <span style={{ color: "var(--bordo)", fontSize: "0.85rem" }}>{chyba}</span>}
        </div>
      </div>

      {/* VÝSTUP */}
      {gen && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Návrh hodnocení</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 14 }}>
            Cokoliv přepiš rovnou v textu. Nebo zadej instrukci dole a nech to přegenerovat.
          </p>

          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--navy)" }}>
              Náhled, jak to bude vypadat se jménem
            </summary>
            <div style={{ background: "#fafbfc", border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginTop: 10, fontSize: "0.9rem", lineHeight: 1.6 }}>
              <p style={{ marginBottom: 8 }}>{dosadJmeno(gen.souhrn, j)}</p>
              {gen.kategorie.map((k, i) => (
                <p key={i} style={{ marginBottom: 8 }}>
                  <strong>{k.nadpis}: </strong>
                  {dosadJmeno(k.text, j)}
                </p>
              ))}
              {gen.zhodnoceniCilu && (
                <p style={{ marginBottom: 8 }}>
                  <strong>Zhodnocení cílů: </strong>
                  {dosadJmeno(gen.zhodnoceniCilu, j)}
                </p>
              )}
            </div>
          </details>

          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 12 }}>
            Pozn.: <code>{"{{Jmeno}}"}</code> v textu se při stažení Wordu nahradí
            skutečným jménem. Ponech ho tam, kde má být jméno.
          </p>

          <Pole label="Shrnutí" value={gen.souhrn} onChange={(v) => setGen({ ...gen, souhrn: v })} />

          {gen.kategorie.map((k, i) => (
            <Pole
              key={i}
              label={k.nadpis}
              value={k.text}
              onChange={(v) => {
                const kat = [...gen.kategorie];
                kat[i] = { ...k, text: v };
                setGen({ ...gen, kategorie: kat });
              }}
            />
          ))}

          {gen.zhodnoceniCilu && (
            <Pole label="Zhodnocení předchozích cílů" value={gen.zhodnoceniCilu} onChange={(v) => setGen({ ...gen, zhodnoceniCilu: v })} />
          )}

          <div style={{ marginBottom: 14 }}>
            <label className="label">Cíle na další období</label>
            {gen.cile.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input
                  className="input"
                  value={c}
                  onChange={(e) => {
                    const cile = [...gen.cile];
                    cile[i] = e.target.value;
                    setGen({ ...gen, cile });
                  }}
                />
                <button className="btn btn-ghost" onClick={() => setGen({ ...gen, cile: gen.cile.filter((_, x) => x !== i) })}>×</button>
              </div>
            ))}
            <button className="btn btn-ghost" onClick={() => setGen({ ...gen, cile: [...gen.cile, ""] })}>+ Přidat cíl</button>
          </div>

          {/* ODMĚNA */}
          <div style={{ background: "#f6f8fb", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={gen.odmena.navrhnout} onChange={(e) => setGen({ ...gen, odmena: { ...gen.odmena, navrhnout: e.target.checked } })} />
              Navrhnout mimořádnou odměnu
            </label>
            <Pole label="Zdůvodnění" value={gen.odmena.zduvodneni} onChange={(v) => setGen({ ...gen, odmena: { ...gen.odmena, zduvodneni: v } })} />
            {gen.odmena.navrhnout && (
              <div style={{ maxWidth: 220 }}>
                <label className="label">Částka (Kč) — doplníš ty</label>
                <input className="input" value={reward} onChange={(e) => setReward(e.target.value)} placeholder="např. 10 000" inputMode="numeric" />
              </div>
            )}
          </div>

          {/* PŘEGENEROVÁNÍ INSTRUKCÍ */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: 220 }}
              value={instrukce}
              onChange={(e) => setInstrukce(e.target.value)}
              placeholder='Instrukce, např. „už je klíčová pracovnice, uprav to"'
            />
            <button className="btn btn-ghost" onClick={() => generuj(true)} disabled={generuji || !instrukce.trim()}>
              {generuji ? "Upravuji..." : "Přegenerovat"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={stahni}>Stáhnout Word</button>
            <button className="btn btn-ghost" onClick={oznacHotovo}>Označit jako hotové</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pole({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="label">{label}</label>
      <textarea className="textarea" value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    </div>
  );
}
