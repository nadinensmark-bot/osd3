"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import EvalEditor from "@/components/EvalEditor";
import {
  type Answers,
  type Employee,
  type Generated,
  type Settings,
  DEFAULT_KATEGORIE,
  prazdneOdpovedi,
} from "@/lib/types";
import { nactiJmena, type Jmeno } from "@/lib/names";

interface EvalRow {
  id: string;
  employee_id: string;
  answers: Answers;
  generated: Generated | null;
  reward_amount: string | null;
  status: "rozpracovano" | "hotovo";
}

export default function KoloDetail() {
  const supabase = createClient();
  const params = useParams();
  const roundId = params.id as string;

  const [nacita, setNacita] = useState(true);
  const [uid, setUid] = useState("");
  const [obdobi, setObdobi] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [jmena, setJmena] = useState<Record<string, Jmeno>>({});
  const [evalMap, setEvalMap] = useState<Record<string, EvalRow>>({});
  const [prevMap, setPrevMap] = useState<Record<string, { generated: Generated | null; answers: Answers }>>({});
  const [vybrany, setVybrany] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUid(u.user.id);

      const { data: round } = await supabase
        .from("rounds")
        .select("*")
        .eq("id", roundId)
        .maybeSingle();
      if (!round) {
        setNacita(false);
        return;
      }
      setObdobi(round.obdobi);

      const { data: s } = await supabase.from("settings").select("*").eq("user_id", u.user.id).maybeSingle();
      setSettings(
        s
          ? (s as Settings)
          : { user_id: u.user.id, kategorie: DEFAULT_KATEGORIE, navrhla: "", navrhla_funkce: "", schvalila: "", schvalila_funkce: "", misto: "Praha" },
      );

      const { data: e } = await supabase.from("employees").select("*").eq("aktivni", true).order("created_at");
      const employees = (e as Employee[]) || [];
      setEmps(employees);
      setJmena(nactiJmena());

      const { data: evs } = await supabase.from("evaluations").select("*").eq("round_id", roundId);
      const m: Record<string, EvalRow> = {};
      for (const ev of (evs as EvalRow[]) || []) m[ev.employee_id] = ev;
      setEvalMap(m);

      // minulé kolo (nejbližší starší)
      const { data: prevRound } = await supabase
        .from("rounds")
        .select("id")
        .lt("created_at", round.created_at)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prevRound) {
        const { data: prevEvs } = await supabase.from("evaluations").select("employee_id, generated, answers").eq("round_id", prevRound.id);
        const pm: Record<string, { generated: Generated | null; answers: Answers }> = {};
        for (const pe of prevEvs || []) pm[pe.employee_id] = { generated: pe.generated, answers: pe.answers };
        setPrevMap(pm);
      }

      if (employees.length) setVybrany(employees[0].id);
      setNacita(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  function stav(empId: string): "nevyplneno" | "rozpracovano" | "hotovo" {
    const ev = evalMap[empId];
    if (!ev) return "nevyplneno";
    return ev.status;
  }

  function onStav(empId: string, status: "rozpracovano" | "hotovo") {
    setEvalMap((m) => ({
      ...m,
      [empId]: { ...(m[empId] || { id: "", employee_id: empId, answers: prazdneOdpovedi(), generated: null, reward_amount: null, status }), status, employee_id: empId },
    }));
  }

  if (nacita)
    return (
      <AppShell>
        <p style={{ color: "var(--muted)" }}>Načítám...</p>
      </AppShell>
    );

  if (!obdobi)
    return (
      <AppShell>
        <p>Kolo nenalezeno. <Link href="/kolo" style={{ color: "var(--navy)" }}>Zpět na kola</Link></p>
      </AppShell>
    );

  const emp = emps.find((e) => e.id === vybrany) || null;
  const hotovo = emps.filter((e) => stav(e.id) === "hotovo").length;

  return (
    <AppShell>
      <div style={{ marginBottom: 18 }}>
        <Link href="/kolo" style={{ color: "var(--muted)", fontSize: "0.85rem", textDecoration: "none" }}>← Kola</Link>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 4 }}>Hodnocení {obdobi}</h1>
        <p style={{ color: "var(--muted)" }}>Hotovo {hotovo} z {emps.length}</p>
      </div>

      {emps.length === 0 ? (
        <div className="card" style={{ color: "var(--muted)" }}>
          Nemáš žádné aktivní zaměstnance. Přidej je v sekci{" "}
          <Link href="/zamestnanci" style={{ color: "var(--navy)" }}>Zaměstnanci</Link>.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 20, alignItems: "start" }}>
          {/* SEZNAM */}
          <div style={{ display: "grid", gap: 6, position: "sticky", top: 16 }}>
            {emps.map((e) => {
              const st = stav(e.id);
              const jm = jmena[e.id];
              const aktiv = e.id === vybrany;
              return (
                <button
                  key={e.id}
                  onClick={() => setVybrany(e.id)}
                  style={{
                    textAlign: "left",
                    padding: "0.6rem 0.75rem",
                    borderRadius: 9,
                    border: "1px solid " + (aktiv ? "var(--navy)" : "var(--line)"),
                    background: aktiv ? "#eef2f8" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {jm?.cele || e.kod}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: tecka(st).barva, fontWeight: 600 }}>
                    {tecka(st).text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* EDITOR */}
          <div>
            {emp && settings && (
              <EvalEditor
                key={emp.id}
                uid={uid}
                roundId={roundId}
                obdobi={obdobi}
                settings={settings}
                employee={emp}
                evaluationId={evalMap[emp.id]?.id || null}
                initAnswers={evalMap[emp.id]?.answers || prevMap[emp.id]?.answers || prazdneOdpovedi()}
                initGenerated={evalMap[emp.id]?.generated || null}
                initReward={evalMap[emp.id]?.reward_amount || null}
                minuleKategorie={prevMap[emp.id]?.generated?.kategorie}
                minuleCile={prevMap[emp.id]?.generated?.cile}
                onStav={(s) => onStav(emp.id, s)}
              />
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function tecka(st: "nevyplneno" | "rozpracovano" | "hotovo") {
  if (st === "hotovo") return { text: "● hotovo", barva: "green" };
  if (st === "rozpracovano") return { text: "● rozpracováno", barva: "#c08400" };
  return { text: "○ nevyplněno", barva: "var(--muted)" };
}
