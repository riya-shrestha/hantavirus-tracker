# MV Hondius / Andes Virus 2026 Outbreak Tracker

A public-facing tracker for the **2026 MV Hondius (Andes virus) cruise outbreak** and its downstream human-to-human transmission. Andes virus is the only hantavirus known to spread person-to-person — the transmission chain itself is the story.

This is a **v0 (hand-curated MVP)**. The v1+ roadmap (automated news-article ingestion, LLM-based extraction, admin review queue, transmission-chain visualization, article-velocity early-warning index) is documented in the implementation plan.

## Run locally

```bash
pip install -r requirements.txt
streamlit run app.py
```

App opens at http://localhost:8501.

## Deploy to Streamlit Community Cloud (free, public)

1. Push this repo to GitHub.
2. Sign in at [share.streamlit.io](https://share.streamlit.io) with your GitHub account.
3. Click "New app" → point to this repo's `main` branch and `app.py`.
4. Click Deploy. Live URL appears in ~1–2 minutes.

## Data sources (tiered)

**Tier 1 — official health agencies** (the basis of headline counts):
- WHO Disease Outbreak News — [DON600 (Hondius cluster)](https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON600)
- CDC HAN — [HAN00528 (US monitoring)](https://www.cdc.gov/han/php/notices/han00528.html)
- ECDC threat reports — [Andes hantavirus outbreak, 12 May 2026](https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak)
- National health agencies of affected countries: Dutch RIVM, German RKI, Swiss BAG/FOPH, South African NICD, UK UKHSA, US state health departments

**Tier 2 — major news with health desks:**
Reuters, AP, NPR, CNN, BBC, NYT, FT, Washington Post — plus regional equivalents (Time, TODAY).

**Tier 3 — expert-curated informal:**
ProMED-mail, HealthMap, CIDRAP.

**Tier 4 — aggregators / blogs:** not counted toward headline.

## Case definition (matches WHO/ECDC convention)

| `case_type` | Meaning |
|---|---|
| `confirmed` | Lab-positive for Andes virus |
| `probable` | Clinically diagnosed; lab pending or negative but consistent epi link |
| `suspected` | Symptomatic, no lab work yet |
| `contact_monitoring` | Asymptomatic, exposed, under public-health watch — **not counted in headline** |
| `death` | Deceased (confirmed or probable) |

The headline total (currently 11) is `confirmed + probable + death`, matching WHO 2026-DON600. The contact-monitoring population (currently 20) is shown separately because it is epidemiologically distinct and not part of the official case tally.

## Inclusion criteria

A case is included if and only if it is **demonstrably linked to the MV Hondius cluster** — i.e., the person was a passenger/crew member, OR is a documented human-to-human secondary transmission from a Hondius case. Endemic Andes virus cases in Argentina/Chile unconnected to the cruise are explicitly excluded.

## Counting conventions

- **One row per named individual.** Where reporting describes an unnamed group (e.g., "15 passengers monitored at UNMC"), a single aggregate row is used with `case_count` set to the group size and notes describing the cluster.
- **Country = primary attribution from official reporting**, typically nationality (the Dutch couple is `NL` regardless of where they died; the British dual-national is `GB`). Location of treatment is noted in the row but doesn't change the country code.
- **`case_type` is frozen** at original classification. `current_status` updates over time (a `suspected` case becoming lab-confirmed gets `current_status: confirmed` but keeps `case_type: suspected`).

## Schema (`data/cases.json`)

```json
{
  "id": "case-XXX",
  "schema_version": 0,
  "country": "US",
  "admin1": "NE",
  "case_type": "confirmed | suspected | death",
  "current_status": "confirmed | suspected_unresolved | excluded | deceased",
  "case_count": 1,
  "date_reported": "2026-05-09",
  "source_articles": [{"url": "...", "source_name": "CDC HAN", "title": "..."}],
  "notes": "..."
}
```

Schema is forward-compatible with v1, which adds `case_signature`, `cluster_id`, `transmission_route`, `source_tier`, `status_breakdown`, and other fields.

## Roadmap (v1+)

Per the implementation plan:

- **Phase 0:** Hand-labeled 50-article gold set + LLM model selection (Haiku vs Sonnet)
- **Phase 1:** Full data layer with case-signature merge logic
- **Phase 2:** Automated ingestion (Google News RSS, CDC HAN scrape, WHO DON, ECDC, ProMED) + LLM extraction with 3-stage filter
- **Phase 3:** Streamlit multi-page UI with admin review queue (session-only GitHub PAT auth)
- **Phase 4:** Transmission-chain visualization (networkx + pyvis) + article-velocity index (Poisson tail)
- **Phase 5:** GitHub Actions daily cron + backfill from April 2026

## License

Data citations preserved per source. Code: TBD.
