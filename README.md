# Hodnocení zaměstnanců – OŠD Praha 3

Webová appka pro koordinátorku péče. Nahradí ruční psaní čtvrtletních hodnocení a návrhů odměn.

**Co umí:**
- Přihlášení pod vlastním účtem.
- Evidence zaměstnanců pod kódy (ZAM1, ZAM2…). **Jména se ukládají jen do prohlížeče koordinátorky, na server ani do AI se neposílají.** Proto se neřeší GDPR na serveru.
- Jednoduchý dotazník (klik, ne psaní) ke každému zaměstnanci.
- AI z toho napíše hodnocení v 6 kategoriích, zhodnotí staré cíle, navrhne nové a doporučí odměnu (částku doplní koordinátorka).
- V novém čtvrtletí se předvyplní odpovědi z minula a AI se vyhýbá opisování starého textu (řeší stížnost „je to pořád stejné").
- Export do Wordu na hlavičkovém papíře OŠD Praha 3, jedna strana na člověka.

Postaveno na Next.js, Supabase (databáze + přihlášení) a Anthropic API (AI).

---

## Jak to zprovoznit (jednorázově, ~15 minut)

Potřebuješ tři věci: účet na Supabase (zdarma), účet na Vercelu (zdarma) a API klíč od Anthropic (placený, provoz řádově desítky Kč měsíčně).

### 1. Supabase (databáze + přihlášení)
1. Jdi na [supabase.com](https://supabase.com), přihlas se, **New project**. Zvol region Frankfurt (EU). Heslo k databázi si ulož.
2. Po vytvoření otevři vlevo **SQL Editor → New query**, otevři soubor `supabase-schema.sql` z tohoto repa, zkopíruj celý obsah, vlož a dej **Run**. Tím se vytvoří tabulky.
3. Vlevo **Project Settings → API**. Zkopíruj si dvě hodnoty:
   - **Project URL** → to je `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** klíč → to je `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Vlevo **Authentication → Sign In / Providers → Email**: pro jednoduchost **vypni „Confirm email"** (ať se máma přihlásí hned bez potvrzovacího e-mailu).

### 2. Anthropic API klíč
1. Jdi na [console.anthropic.com](https://console.anthropic.com), založ účet, nabij si kredit (stačí pár dolarů).
2. **API Keys → Create Key**, zkopíruj hodnotu `sk-ant-...`. To je `ANTHROPIC_API_KEY`. **Nikam ji nedávej do prohlížeče, patří jen na server (Vercel).**

### 3. Vercel (hosting)
1. Jdi na [vercel.com](https://vercel.com), přihlas se přes GitHub.
2. **Add New → Project → Import** repo `osd3`.
3. V kroku **Environment Variables** přidej:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | z Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | z Supabase |
   | `ANTHROPIC_API_KEY` | z Anthropic |
   | `ANTHROPIC_MODEL` | `claude-sonnet-5-5` (volitelné) |
4. **Deploy.** Za chvíli dostaneš adresu typu `osd3-xxxx.vercel.app`. Tu pošli mámě.

### 4. První spuštění
1. Otevři adresu, **Zaregistrovat se** (e-mail + heslo). To je mámin účet.
2. **Nastavení**: vyplň, kdo navrhuje (vrchní sestra) a kdo schvaluje (ředitelka), a místo.
3. **Zaměstnanci**: přidej lidi (nebo hromadně vlož seznam jmen). U každého zkontroluj pohlaví a případně pozici.
4. **Hodnocení → Nové kolo** → vyber období → u každého proklikej dotazník a dej **Vygenerovat** → uprav → **Stáhnout Word**.

---

## Model AI
Název modelu se nastavuje přes `ANTHROPIC_MODEL`. Aktuální názvy viz [docs.claude.com/en/docs/about-claude/models](https://docs.claude.com/en/docs/about-claude/models). Bez nastavení se použije `claude-sonnet-5-5`.

## Pozn. k GDPR
Na serveru (Supabase) je ke každému záznamu jen kód `ZAMx`, pohlaví, pozice a texty hodnocení bez jména. Mapování kód → jméno je výhradně v `localStorage` prohlížeče, ve kterém máma pracuje. Když si appku otevře na jiném počítači, jména tam nebudou (data hodnocení ano). Záloha jmen: lze dodělat export/import, zatím neřešeno.

## Lokální vývoj
```bash
cp .env.example .env.local   # doplň hodnoty
npm install
npm run dev
```
