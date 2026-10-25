import type { Answers, Generated } from "./types";

// Vstup pro generování (bez jména – AI dostane jen kód a pohlaví kvůli skloňování).
export interface GenerateInput {
  obdobi: string;
  pozice: string;
  pohlavi: "zena" | "muz";
  nastup: string;
  kategorie: string[];
  answers: Answers;
  // z minulého kola, aby se text neopakoval a daly se zhodnotit cíle
  minuleKategorie?: { nadpis: string; text: string }[];
  minuleCile?: string[];
  // volitelná instrukce pro přepsání už vygenerovaného hodnocení
  instrukce?: string;
  predchoziVystup?: Generated;
}

const ZNAMKY: Record<number, string> = {
  0: "nehodnoceno",
  1: "slabé / problém",
  2: "spíše slabší",
  3: "průměr / v normě",
  4: "dobré",
  5: "výborné",
};

export const SYSTEM = `Jsi zkušená vrchní sestra / koordinátorka péče v českém ošetřovatelském domově pro seniory. Píšeš čtvrtletní hodnocení pečovatelů a zdravotnického personálu pro vedení (ředitelku).

STYL:
- Česky, profesionálně, konkrétně, lidsky a oceňujícím tónem, ale upřímně. Když je co zlepšit, napiš to konstruktivně (ne drsně, ne mlžením).
- Vycházej POUZE ze zadaných vstupů. Nic si nevymýšlej. Když je nějaká oblast "nehodnoceno" nebo bez poznámky, napiš krátce a obecně, nebo ji vynech, ale nevymýšlej detaily.
- Nepoužívej dlouhé pomlčky. Místo nich čárku, dvojtečku nebo závorku.
- Odborné názvy nech, jak jsou: IS CYGNUS II, klíčový pracovník.
- Jméno osoby NEZNÁŠ. Místo jména piš token {{Jmeno}} na začátku věty a {{jmeno}} uvnitř věty. Nikdy nepiš "zaměstnanec" ani kód. Skloňuj okolní text podle pohlaví.

DŮLEŽITÉ (tohle je klíčové): Hodnocení se píše každé čtvrtletí a u většiny lidí se nic zásadního nemění. NEOPISUJ minulé věty. Pokud se výkon nezměnil, buď to napiš stručně a jinými slovy než minule, nebo zdůrazni posun/stabilitu. Rozhodně nevyráběj dlouhé fráze jen aby byl text delší.

ODMĚNA: Na základě vstupů navrhni, zda dát mimořádnou odměnu (true/false) a stručně zdůvodni. Částku neuváděj, tu doplní koordinátorka.

Odpověz POUZE validním JSONem bez komentářů a bez markdown bloků, přesně v této struktuře:
{
  "souhrn": "1 až 2 věty celkového shrnutí",
  "kategorie": [{"nadpis": "přesný nadpis kategorie", "text": "2 až 4 věty"}],
  "zhodnoceniCilu": "zhodnocení plnění cílů z minula, nebo prázdný řetězec když žádné nebyly",
  "cile": ["konkrétní cíl na další období", "..."],
  "odmena": {"navrhnout": true, "zduvodneni": "1 až 2 věty"}
}`;

export function buildUserPrompt(input: GenerateInput): string {
  const a = input.answers;
  const l: string[] = [];
  l.push(`OBDOBÍ: ${input.obdobi}`);
  l.push(`POZICE: ${input.pozice || "pečovatel/ka"}`);
  l.push(`POHLAVÍ (pro skloušení): ${input.pohlavi === "muz" ? "muž" : "žena"}`);
  if (input.nastup) l.push(`V DOMOVĚ: ${input.nastup}`);
  l.push("");
  l.push("HODNOCENÉ OBLASTI (1 nejhorší až 5 nejlepší):");
  l.push(`- Přístup ke klientům: ${a.klienti}/5 (${ZNAMKY[a.klienti]})`);
  l.push(`- Práce v IS CYGNUS II: ${a.cygnus}/5 (${ZNAMKY[a.cygnus]})`);
  l.push(`- Spolupráce v týmu: ${a.tym}/5 (${ZNAMKY[a.tym]})`);
  l.push(`- Efektivita a samostatnost: ${a.efektivita}/5 (${ZNAMKY[a.efektivita]})`);
  l.push(`- Spokojenost klientů / zpětná vazba: ${a.zpetnaVazba}/5 (${ZNAMKY[a.zpetnaVazba]})`);
  l.push(`- Zvládání češtiny / jazyk: ${a.jazyk}/5 (${ZNAMKY[a.jazyk]})`);
  l.push(`- Klíčový pracovník: ${a.klicovyPracovnik ? "ANO" : "NE"}`);
  if (a.stitky.length) l.push(`- Postřehy: ${a.stitky.join(", ")}`);
  if (a.poznamka.trim()) l.push(`- Poznámka koordinátorky: ${a.poznamka.trim()}`);
  l.push("");
  l.push(`KATEGORIE, KTERÉ MÁ HODNOCENÍ OBSAHOVAT (přesně tyto nadpisy, v tomto pořadí):`);
  input.kategorie.forEach((k) => l.push(`- ${k}`));

  if (input.minuleCile?.length) {
    l.push("");
    l.push("CÍLE Z MINULÉHO OBDOBÍ (zhodnoť jejich plnění):");
    input.minuleCile.forEach((c) => l.push(`- ${c}`));
  }
  if (input.minuleKategorie?.length) {
    l.push("");
    l.push("MINULÉ HODNOCENÍ (NEOPISUJ ho, piš jinými slovy, zachyť vývoj):");
    input.minuleKategorie.forEach((k) => l.push(`- ${k.nadpis}: ${k.text}`));
  }
  return l.join("\n");
}

export function buildRevisedPrompt(input: GenerateInput): string {
  return [
    "Toto je už vygenerované hodnocení. Uprav ho podle instrukce koordinátorky a vrať CELÝ JSON ve stejné struktuře.",
    "",
    "INSTRUKCE: " + (input.instrukce || ""),
    "",
    "STÁVAJÍCÍ HODNOCENÍ (JSON):",
    JSON.stringify(input.predchoziVystup, null, 2),
  ].join("\n");
}

// Robustní parsování – AI občas obalí JSON do ```json bloku.
export function parseGenerated(raw: string): Generated {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first > 0 || last < s.length - 1) s = s.slice(first, last + 1);
  const o = JSON.parse(s);
  return {
    souhrn: String(o.souhrn || ""),
    kategorie: Array.isArray(o.kategorie)
      ? o.kategorie.map((k: { nadpis?: string; text?: string }) => ({
          nadpis: String(k.nadpis || ""),
          text: String(k.text || ""),
        }))
      : [],
    zhodnoceniCilu: String(o.zhodnoceniCilu || ""),
    cile: Array.isArray(o.cile) ? o.cile.map((c: unknown) => String(c)) : [],
    odmena: {
      navrhnout: Boolean(o.odmena?.navrhnout),
      zduvodneni: String(o.odmena?.zduvodneni || ""),
    },
  };
}
