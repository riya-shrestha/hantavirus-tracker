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

## Data sources

All cases in `data/cases.json` are hand-curated from:

- **CDC HAN Notice HAN00528** — 2026 Multi-country Hantavirus Cluster Linked to Cruise Ship
- **WHO Disease Outbreak News** — Andes virus updates
- **NPR, CNN, TODAY** — national news coverage of the outbreak

## Methodology

This v0 includes only cases that are:

1. **Linked to the MV Hondius cluster** — cruise passengers/crew OR documented human-to-human transmission from a cruise case.
2. **Reported by tier-1 or tier-2 sources** — national health agencies (CDC, WHO) or major national news with health desks (Reuters, AP, NPR, CNN, BBC, NBC).

Cases are tracked **per-person where named individually**. Where reporting describes groups (e.g., "15 passengers monitored at UNMC"), a single aggregate row is used with `case_count` set to the group size.

`case_type` is the original classification at first reporting. `current_status` is the latest known state and updates as situations develop.

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
