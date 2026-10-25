"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";

interface R {
  id: string;
  obdobi: string;
  created_at: string;
}

function navrhObdobi(): string {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${q}Q ${d.getFullYear()}`;
}

export default function KoloIndex() {
  const supabase = createClient();
  const router = useRouter();
  const [rounds, setRounds] = useState<R[]>([]);
  const [obdobi, setObdobi] = useState(navrhObdobi());
  const [nacita, setNacita] = useState(true);
  const [zaklada, setZaklada] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("rounds")
        .select("id, obdobi, created_at")
        .order("created_at", { ascending: false });
      setRounds((data as R[]) || []);
      setNacita(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function zaloz() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !obdobi.trim()) return;
    setZaklada(true);
    const { data } = await supabase
      .from("rounds")
      .insert({ user_id: u.user.id, obdobi: obdobi.trim() })
      .select()
      .single();
    if (data) router.push(`/kolo/${data.id}`);
  }

  return (
    <AppShell>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 20 }}>
        Hodnocení
      </h1>

      <div className="card" style={{ marginBottom: 26 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Nové čtvrtletní kolo</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label">Období</label>
            <input
              className="input"
              value={obdobi}
              onChange={(e) => setObdobi(e.target.value)}
              placeholder="4Q 2025"
            />
          </div>
          <button className="btn btn-primary" onClick={zaloz} disabled={zaklada}>
            {zaklada ? "Zakládám..." : "Založit kolo"}
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: 10 }}>
          V novém kole se u každého předvyplní odpovědi z minula, takže měníš jen
          to, co se změnilo.
        </p>
      </div>

      <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Dřívější kola</h2>
      {nacita ? (
        <p style={{ color: "var(--muted)" }}>Načítám...</p>
      ) : rounds.length === 0 ? (
        <div className="card" style={{ color: "var(--muted)" }}>Zatím žádné.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rounds.map((r) => (
            <Link
              key={r.id}
              href={`/kolo/${r.id}`}
              className="card"
              style={{ display: "flex", justifyContent: "space-between", textDecoration: "none", color: "var(--text)" }}
            >
              <strong>{r.obdobi}</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                {new Date(r.created_at).toLocaleDateString("cs-CZ")} →
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
