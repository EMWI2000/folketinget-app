# Løndata – datastruktur og forbehold

Denne note dokumenterer strukturen i løndata fra
[loenoverblik.dk](https://loenoverblik.dk) (Økonomistyrelsens/Moderniseringsstyrelsens
lønoverblik), som den ligger i `public/loendata/*.csv`. Den er baseret på en
fuld gennemgang af alle 161.210 datarækker på tværs af de 7 filer (juni 2026).
Læs den før du ændrer parsing, aggregering eller visualiseringer – datasættet er
struktureret på et par måder, der let kan føre til forkerte konklusioner.

## Filer (tabelfordelinger)

Hver fil er **samme underliggende statslige lønstatistik vist i én detaljegrad**.
Flere dimensioner = finere opdeling. Tal er gennemsnit pr. årsværk pr. måned (kr./md.).

| Fil | Datarækker | Dimensioner ud over hovedkonto |
| --- | --- | --- |
| `pkat.csv` | 8.237 | Personalekategori |
| `pkat_klasse.csv` | 15.628 | Personalekategori, Klasse/Lønramme |
| `pkat_loentrin.csv` | 21.305 | Personalekategori, Løntrin |
| `pkat_stilling.csv` | 22.682 | Personalekategori, Stilling |
| `pkat_klasse_loentrin.csv` | 24.493 | Personalekategori, Klasse/Lønramme, Løntrin |
| `stilling.csv` | 16.597 | Stilling |
| `pkat_stilling_loentrin.csv` | 52.268 | Personalekategori, Stilling, Løntrin |

Faste kolonner i alle filer: 8 lønkomponenter (Basisløn, Plustid, Pension,
Faste/midl. tillæg (Centrale), Faste tillæg (Lokale), Midlert. tillæg (Lokale),
Engangs-vederlag, Andre tillæg), `Årsværk`, `Samlet løn`, `Periode`,
`Ministerområde`, `Hovedkonto`, `Type`. Filerne har BOM, og `Periode` er
citeret med internt komma (`"2026, 1. kvt."`). Decimaltegn er punktum.

## Hierarki

- **Hovedkonto** følger 100 % konsekvent `§N.N.N - navn`
  (paragraf · aktivitetsområde · hovedkonto), fx `§10.11.01 - Departementet`.
  215/215 matcher mønsteret.
- Hovedkontoens paragraf-præfiks matcher **altid** ministerområdets paragraf
  (0 mismatch). Ministerområde kan udledes direkte fra hovedkontonummeret.
- **27 ministerområder**, **215 hovedkonti**.
- **Type** har kun 3 værdier: `Andet` (138 hovedkonti), `Styrelse` (54),
  `Departement` (23).

### Validerede antagelser (sikre at bygge på)

- **`Type` og `Ministerområde` er entydige pr. hovedkonto** (0 hovedkonti har
  mere end ét af hver). Derfor er det korrekt at tage dem fra første række ved
  aggregering pr. hovedkonto.
- **Vægtet gennemsnit** Σ(løn × årsværk) / Σ(årsværk) er den rigtige aggregering.
  Lønniveauet er robust på tværs af tabelfordelinger (afvigelse typisk < 1 %).
- **Komponenterne summerer til `Samlet løn`** (±1–3 kr afrundingsstøj) – **når
  Plustid tælles med**. Plustid er *inkluderet* i Samlet løn, ikke additiv oveni.
- `Samlet løn` er aldrig ≤ 0 (min 2.400 kr/md). Min `Årsværk` = 3,0.

## Faldgruber (vigtige)

### 1. Periodedækningen er asymmetrisk

6 af 7 filer dækker **kun** `2024 Q1–Q4` + `2026 Q1` – **hele 2025 mangler**.
Kun `pkat_stilling_loentrin.csv` har alle 9 kvartaler (2024 Q1 – 2026 Q1).

Konsekvenser:
- En tidsserie må **ikke** bruge en index-baseret x-akse (så tegnes et hul på 5
  kvartaler som ét). Brug en tidsbaseret akse, og markér kvartaler uden data.
- 16–18 % af hovedkontiene findes kun i ét af årene (kun 2024 *eller* kun 2026).
- 2026 Q1 bygger på ~3–5 % færre rækker end 2024-kvartalerne (formentlig
  foreløbige data) og bør tolkes med forbehold.

### 2. Årsværk-totaler er IKKE sammenlignelige på tværs af tabelfordeling

Kilden udelader grupper med under 3 årsværk (anonymisering). Jo finere
detaljegrad, jo flere små grupper falder bort. For samme hovedkonto og periode
kan **op til ~16,4 %** af årsværkene "forsvinde" fra groveste (`pkat`) til
fineste (`pkat_stilling_loentrin`) fordeling (gennemsnit ~5 %, mest på
uddannelsesinstitutioner). Op til 15 små hovedkonti mangler helt i de fineste
filer.

Den **vægtede gennemsnitsløn** er derimod stabil (< 1 %), fordi de droppede
grupper er små. Så: lønbenchmark kan sammenlignes på tværs af fordeling – men
**årsværk-totaler kan ikke**.

### 3. Filerne må aldrig mikses

De finere filer er ikke komplette underopdelinger af de grovere (diskretion
fjerner celler). Man kan **ikke** rekonstruere en total ved at summere en finere
fil, og man må ikke aggregere på tværs af filer. Brug én fil pr. visning.

### 4. Lønkomponenter: negative værdier og afrunding

- Tillægskomponenter kan være **negative** (legitime korrektioner/tilbageførsler):
  Andre tillæg (0,28 % af rækker, ned til −1.727), Centrale (0,08 %, ned til
  −16.092), Engangsvederlag, Lokale faste. Basisløn, Plustid, Pension og Lokale
  midlertidige er aldrig negative.
- På fuldt hovedkonto-niveau bliver ingen aggregeret komponent negativ. **Men med
  dimensionsfiltre aktive** (hovedkonto × kategori/stilling) *kan* en aggregeret
  komponent blive negativ i 2026 Q1.
- En stablet komponent-graf, der klipper negative til 0, vil derfor kunne
  overstige den reelle `Samlet løn`. **Brug `Samlet løn`-kolonnens egen værdi som
  total** frem for at summere de (afrundede/klippede) komponenter.
- **Plustid er 0 i 90,7 % af rækkerne** – en næsten "død" komponent visuelt.

### 5. Sortering af dimensionsfiltre

`Personalekategori`, `Klasse/Lønramme` og `Løntrin` har nummer-præfikser, der
**ikke er nul-paddede** (`6`, `46`, `146`, `240`). Ren strengsortering giver
`240` før `46` før `6`. Brug numerisk-bevidst sortering
(`localeCompare(b, 'da', { numeric: true })`). Det samme gælder ministerområder
(`§3` skal før `§10`). `Stilling` (fritekst) sorterer fint alfabetisk. `Løntrin`
har desuden 6+ inkompatible formatfamilier (LR-rammer, AC basisløntrin, Trin N,
…) og kan ikke sorteres perfekt uden en eksplicit gruppe-rangordning.

### 6. Outliers

`Samlet løn` spænder fra 2.400 til 199.268 kr/md. De højeste er
Højesteretsdommere (~4× medianen på ~49.000). Graferne skalerer pr. udvalg
(ikke en global akse), så outliers dominerer kun, hvis brugeren selv vælger dem
sammen med små konti – hvilket er korrekt sammenligningsadfærd.

## Praktisk parsing

Brug Python `csv` med `encoding="utf-8-sig"` (BOM) ved analyse – ikke
`awk`/`cut`, da `Periode` indeholder et citeret komma og kolonneantallet
varierer mellem filer. I appen håndterer `parser.ts` allerede BOM, citerede
felter og kolonnerækkefølge via header-baseret mapping.
