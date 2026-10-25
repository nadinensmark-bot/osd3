import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  SYSTEM,
  buildUserPrompt,
  buildRevisedPrompt,
  parseGenerated,
  type GenerateInput,
} from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

// Model lze změnit přes env ANTHROPIC_MODEL (viz README).
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export async function POST(req: Request) {
  // Ověření přihlášení – generovat může jen přihlášený uživatel.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepřihlášeno." }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chybí ANTHROPIC_API_KEY v nastavení serveru." },
      { status: 500 },
    );
  }

  let input: GenerateInput;
  try {
    input = (await req.json()) as GenerateInput;
  } catch {
    return NextResponse.json({ error: "Neplatný vstup." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userPrompt = input.instrukce
    ? buildRevisedPrompt(input)
    : buildUserPrompt(input);

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });
    const raw = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const generated = parseGenerated(raw);
    return NextResponse.json({ generated });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "neznámá chyba";
    return NextResponse.json(
      { error: "Generování selhalo: " + detail },
      { status: 502 },
    );
  }
}
