"use client";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Header,
  Footer,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
} from "docx";
import { saveAs } from "file-saver";
import type { Generated, Settings } from "./types";
import { dosadJmeno, type Jmeno } from "./names";

const FONT = "Times New Roman";
const NAVY = "1F3A5F";

export interface ExportInput {
  generated: Generated;
  jmeno: Jmeno | null;
  kod: string;
  pozice: string;
  obdobi: string;
  settings: Settings;
  rewardAmount: string | null; // doplní koordinátorka, jinak [DOPLNIT]
  datum: string; // dd.mm.yyyy
}

function p(text: string, opts: { bold?: boolean; size?: number; color?: string; after?: number; before?: number } = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    children: [
      new TextRun({
        text,
        font: FONT,
        bold: opts.bold,
        size: (opts.size ?? 12) * 2, // půlbody
        color: opts.color,
      }),
    ],
  });
}

async function logoRun(): Promise<ImageRun | null> {
  try {
    const res = await fetch("/brand/osd3-logo.png");
    const buf = await res.arrayBuffer();
    return new ImageRun({
      data: buf,
      type: "png",
      transformation: { width: 60, height: 60 },
    });
  } catch {
    return null;
  }
}

export async function exportDocx(input: ExportInput) {
  const { generated: g, jmeno, kod, pozice, obdobi, settings, datum } = input;
  const dos = (t: string) => dosadJmeno(t, jmeno);
  const nadpisJmeno = jmeno ? dosadJmeno("{{celeJmeno}}", jmeno) : kod;

  const logo = await logoRun();

  // ---- HLAVIČKA ----
  const header = new Header({
    children: [
      new Paragraph({
        children: logo ? [logo] : [],
        spacing: { after: 40 },
      }),
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({ text: "Ošetřovatelský domov Praha 3", font: FONT, bold: true, size: 24, color: NAVY }),
        ],
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 6 } },
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: "Pod Lipami 2570/44, Habrová 2654/2, 130 00 Praha 3",
            font: FONT,
            size: 18,
            color: "666666",
          }),
        ],
      }),
    ],
  });

  // ---- PATIČKA ----
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 6 } },
        spacing: { before: 60 },
        children: [
          new TextRun({ text: "Tel.: 284 823 822    IČ: 65990641    č.ú.: 12666379/0800    www.domovpraha3.cz", font: FONT, size: 16, color: "888888" }),
        ],
      }),
    ],
  });

  // ---- TĚLO ----
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: `Čtvrtletní hodnocení zaměstnance`, font: FONT, bold: true, size: 30, color: NAVY })],
    }),
  );
  children.push(p(`${nadpisJmeno}${pozice ? ", " + pozice : ""}  ·  období ${obdobi}`, { color: "555555", after: 220 }));

  if (g.souhrn) children.push(p(g.souhrn, { after: 220 }));

  for (const k of g.kategorie) {
    children.push(p(k.nadpis, { bold: true, size: 13, color: NAVY, after: 40, before: 80 }));
    children.push(p(dos(k.text)));
  }

  if (g.zhodnoceniCilu) {
    children.push(p("Zhodnocení předchozích cílů", { bold: true, size: 13, color: NAVY, after: 40, before: 120 }));
    children.push(p(dos(g.zhodnoceniCilu)));
  }

  if (g.cile.length) {
    children.push(p("Cíle na další období", { bold: true, size: 13, color: NAVY, after: 40, before: 120 }));
    for (const c of g.cile) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [new TextRun({ text: dos(c), font: FONT, size: 24 })],
        }),
      );
    }
  }

  // ---- ODMĚNA ----
  children.push(p("Návrh odměny", { bold: true, size: 13, color: NAVY, after: 40, before: 160 }));
  if (g.odmena.navrhnout) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "Navrhuji mimořádnou finanční odměnu ve výši ", font: FONT, size: 24 }),
          new TextRun({ text: (input.rewardAmount?.trim() || "[DOPLNIT]") + " Kč", font: FONT, size: 24, bold: true }),
          new TextRun({ text: ".", font: FONT, size: 24 }),
        ],
      }),
    );
    children.push(p(dos(g.odmena.zduvodneni)));
  } else {
    children.push(p("Mimořádnou odměnu za toto období nenavrhuji."));
    if (g.odmena.zduvodneni) children.push(p(dos(g.odmena.zduvodneni)));
  }

  // ---- PODPISY ----
  const podpisAfter = 60;
  children.push(
    new Paragraph({
      spacing: { before: 320, after: podpisAfter },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [new TextRun({ text: `Navrhla: ${settings.navrhla}`, font: FONT, size: 24 })],
    }),
  );
  children.push(p(settings.navrhla_funkce, { color: "555555", after: 220 }));

  children.push(
    new Paragraph({
      spacing: { after: podpisAfter },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: `Schválila: ${settings.schvalila}`, font: FONT, size: 24 }),
        new TextRun({ text: `\tV ${settings.misto} dne ${datum}`, font: FONT, size: 24 }),
      ],
    }),
  );
  children.push(p(settings.schvalila_funkce, { color: "555555" }));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1400, bottom: 1000, left: 1400, right: 1400 } },
        },
        headers: { default: header },
        footers: { default: footer },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const nazev = `Hodnoceni_${(jmeno?.cele || kod).replace(/\s+/g, "_")}_${obdobi.replace(/\s+/g, "")}.docx`;
  saveAs(blob, nazev);
}
