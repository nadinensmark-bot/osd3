"use client";

// Mapování kód → jméno žije POUZE v prohlížeči koordinátorky (localStorage).
// Na server ani do AI se nikdy neodesílá. Proto appka řeší jen kódy (ZAM1...)
// a GDPR zůstává na straně jednoho zařízení.

export interface Jmeno {
  cele: string; // "Sandra Andrýsková" – do nadpisu a doplnění do Wordu
  osloveni: string; // "paní" / "pan"
  krestni: string; // "Sandra" – jak ji oslovovat v textu
}

const KEY = "osd3-jmena";

export function nactiJmena(): Record<string, Jmeno> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function ulozJmeno(employeeId: string, j: Jmeno) {
  const all = nactiJmena();
  all[employeeId] = j;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function smazJmeno(employeeId: string) {
  const all = nactiJmena();
  delete all[employeeId];
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function jmeno(employeeId: string): Jmeno | null {
  return nactiJmena()[employeeId] || null;
}

// Nahradí tokeny ve vygenerovaném textu skutečným jménem (jen v prohlížeči).
// {{Jmeno}} – začátek věty (Paní Sandra), {{jmeno}} – uvnitř věty (paní Sandra),
// {{celeJmeno}} – plné jméno.
export function dosadJmeno(text: string, j: Jmeno | null): string {
  if (!j) return text; // bez jména necháme kód / tokeny tak, jak jsou
  const velke =
    j.osloveni.charAt(0).toUpperCase() + j.osloveni.slice(1) + " " + j.krestni;
  const male = j.osloveni + " " + j.krestni;
  return text
    .replaceAll("{{Jmeno}}", velke)
    .replaceAll("{{jmeno}}", male)
    .replaceAll("{{celeJmeno}}", j.cele);
}
