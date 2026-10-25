// Datové typy sdílené celou aplikací.
// DŮLEŽITÉ: na server ani do AI nikdy nejde jméno zaměstnance, pouze kód (ZAM1...).

export type Pohlavi = "zena" | "muz";

export interface Employee {
  id: string;
  user_id: string;
  kod: string; // ZAM1, ZAM2...
  pozice: string;
  pohlavi: Pohlavi; // kvůli českému skloňování v textu
  nastup: string; // volný text, např. "od 2022" nebo "3 roky"
  aktivni: boolean;
  created_at: string;
}

export interface Settings {
  user_id: string;
  kategorie: string[]; // nadpisy kategorií v hodnocení
  navrhla: string;
  navrhla_funkce: string;
  schvalila: string;
  schvalila_funkce: string;
  misto: string;
}

export interface Round {
  id: string;
  user_id: string;
  obdobi: string; // "4Q 2025"
  created_at: string;
}

// Odpovědi z dotazníku pro jednoho zaměstnance (vstup pro AI).
export interface Answers {
  // rychlé hodnocení 1-5 (0 = nehodnoceno / nehodí se)
  klienti: number;
  cygnus: number;
  tym: number;
  efektivita: number;
  zpetnaVazba: number;
  jazyk: number; // zvládání češtiny / jazyková bariéra
  // ano/ne
  klicovyPracovnik: boolean;
  // štítky chování (rychlý výběr)
  stitky: string[];
  // volitelná poznámka ke každé oblasti
  poznamka: string;
}

export interface Odmena {
  navrhnout: boolean;
  zduvodneni: string;
}

// Výstup z AI pro jednoho zaměstnance. Jméno nahrazeno tokeny {{Jmeno}} / {{jmeno}}.
export interface Generated {
  souhrn: string;
  kategorie: { nadpis: string; text: string }[];
  zhodnoceniCilu: string;
  cile: string[];
  odmena: Odmena;
}

export interface Evaluation {
  id: string;
  round_id: string;
  employee_id: string;
  user_id: string;
  answers: Answers;
  generated: Generated | null;
  reward_amount: string | null; // doplní koordinátorka před exportem
  status: "rozpracovano" | "hotovo";
  created_at: string;
}

export const DEFAULT_KATEGORIE = [
  "Individuální přístup ke klientům",
  "Práce v IS CYGNUS II",
  "Klíčový pracovník",
  "Spolupráce v týmu",
  "Efektivita práce",
  "Spokojenost klientů a zpětná vazba",
];

export const STITKY = [
  "chodí včas",
  "bere služby navíc",
  "pracuje nad rámec",
  "spolehlivý/á",
  "iniciativní",
  "potřebuje dohled",
  "zaučuje nové kolegy",
  "flexibilní, zaskakuje",
  "časté absence",
  "jazyková bariéra",
];

export function prazdneOdpovedi(): Answers {
  return {
    klienti: 0,
    cygnus: 0,
    tym: 0,
    efektivita: 0,
    zpetnaVazba: 0,
    jazyk: 0,
    klicovyPracovnik: false,
    stitky: [],
    poznamka: "",
  };
}
