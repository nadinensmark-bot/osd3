"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rezim, setRezim] = useState<"login" | "registrace">("login");
  const [email, setEmail] = useState("");
  const [heslo, setHeslo] = useState("");
  const [chyba, setChyba] = useState("");
  const [info, setInfo] = useState("");
  const [nacita, setNacita] = useState(false);

  async function odeslat(e: React.FormEvent) {
    e.preventDefault();
    setChyba("");
    setInfo("");
    setNacita(true);
    try {
      if (rezim === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: heslo,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: heslo,
        });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfo(
            "Účet vytvořen. Pokud je zapnuté potvrzení e-mailem, klikni na odkaz v e-mailu a pak se přihlas.",
          );
          setRezim("login");
        }
      }
    } catch (err) {
      setChyba(err instanceof Error ? prelozChybu(err.message) : "Chyba.");
    } finally {
      setNacita(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/osd3-logo.png"
            alt="OŠD Praha 3"
            style={{ height: 56, margin: "0 auto 10px" }}
          />
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            Hodnocení zaměstnanců
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
            Ošetřovatelský domov Praha 3
          </p>
        </div>

        <form onSubmit={odeslat}>
          <label className="label">E-mail</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: 12 }}
          />
          <label className="label">Heslo</label>
          <input
            className="input"
            type="password"
            value={heslo}
            onChange={(e) => setHeslo(e.target.value)}
            required
            minLength={6}
            style={{ marginBottom: 16 }}
          />
          {chyba && (
            <p style={{ color: "var(--bordo)", fontSize: "0.85rem", marginBottom: 12 }}>
              {chyba}
            </p>
          )}
          {info && (
            <p style={{ color: "var(--navy)", fontSize: "0.85rem", marginBottom: 12 }}>
              {info}
            </p>
          )}
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={nacita}
          >
            {nacita
              ? "Pracuji..."
              : rezim === "login"
                ? "Přihlásit se"
                : "Vytvořit účet"}
          </button>
        </form>

        <button
          onClick={() => {
            setRezim(rezim === "login" ? "registrace" : "login");
            setChyba("");
            setInfo("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: "0.85rem",
            marginTop: 14,
            width: "100%",
          }}
        >
          {rezim === "login"
            ? "Nemáte účet? Zaregistrovat se"
            : "Už mám účet, přihlásit se"}
        </button>
      </div>
    </div>
  );
}

function prelozChybu(m: string): string {
  if (m.includes("Invalid login")) return "Špatný e-mail nebo heslo.";
  if (m.includes("already registered")) return "Tento e-mail už je registrovaný.";
  if (m.includes("Password")) return "Heslo musí mít aspoň 6 znaků.";
  return m;
}
