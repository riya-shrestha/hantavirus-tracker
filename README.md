# MV Hondius / Andes Virus 2026 Outbreak Tracker

A public-facing tracker for the **2026 MV Hondius (Andes virus) cruise outbreak** and its downstream human-to-human transmission. Andes virus is the only hantavirus known to spread person-to-person — the transmission chain itself is the story.

## Monorepo layout

```
hantavirus-tracker/
├── data/                # Shared source of truth (cases.json)
├── web/                 # Next.js 15 + TypeScript frontend (v1, under construction)
├── pipeline/            # Python data pipeline (LLM ingestion, future)
├── streamlit-v0/        # Archived hand-curated v0 MVP (shipped 2026-05-11)
└── README.md
```

- `data/cases.json` is the source of truth. Both `web/` and `pipeline/` read it; only `pipeline/` (and admin actions via GitHub API) write to it.
- `web/` is a Next.js app deployed to Vercel. See `web/README.md` once it exists.
- `pipeline/` will hold the Python ingestion + LLM extraction scripts. See implementation plan.
- `streamlit-v0/` is the original hand-curated MVP, kept for reference. Still runnable.

## Status

| Component | State |
|---|---|
| `data/cases.json` | **Live.** 11 cases (7 confirmed + 1 probable + 3 deaths + 20 under monitoring) matching WHO 2026-DON600 |
| `streamlit-v0/` | **Live.** Original Streamlit MVP. Runs locally; deployed to Streamlit Community Cloud |
| `web/` | **Under construction.** v1 frontend (Next.js 15 + Tailwind + shadcn/ui + react-globe.gl) |
| `pipeline/` | **Not started.** Will hold automated ingestion + LLM extraction |

## Data sources (tiered)

**Tier 1 — official health agencies** (basis of headline counts):
- WHO Disease Outbreak News — [DON600 (Hondius cluster)](https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600)
- CDC HAN — [HAN00528 (US monitoring)](https://www.cdc.gov/han/php/notices/han00528.html)
- ECDC — [Andes hantavirus outbreak, 12 May 2026](https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak)
- National health agencies of affected countries (RIVM, RKI, BAG, NICD, UKHSA, US state health depts)

**Tier 2 — major news with health desks:**
Reuters, AP, NPR, CNN, BBC, NYT, FT, Washington Post, regional equivalents.

**Tier 3 — expert-curated informal:** ProMED-mail, HealthMap, CIDRAP.

## Case definition (matches WHO/ECDC convention)

| `case_type` | Meaning |
|---|---|
| `confirmed` | Lab-positive for Andes virus |
| `probable` | Clinically diagnosed; lab pending or negative but consistent epi link |
| `suspected` | Symptomatic, no lab work yet |
| `contact_monitoring` | Asymptomatic, exposed, under public-health watch — **not counted in headline** |
| `death` | Deceased (confirmed or probable) |

Headline total (currently 11) = `confirmed + probable + death`, matching WHO 2026-DON600.

## Inclusion criteria

A case is included if and only if it is **demonstrably linked to the MV Hondius cluster** — i.e., the person was a passenger/crew member, OR is a documented human-to-human secondary transmission from a Hondius case. Endemic Andes virus cases in Argentina/Chile unconnected to the cruise are explicitly excluded.

## License

Data citations preserved per source. Code: TBD.
