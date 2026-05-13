# Streamlit v0 (archived)

This is the original hand-curated MVP shipped 2026-05-11. It reads `../data/cases.json` and renders a single Streamlit page with a world choropleth + case list.

**This is no longer actively developed.** v1 is being built in `/web` (Next.js + TypeScript) using the same `data/cases.json` source of truth. Once v1 ships, this directory may be removed.

## Run locally

```bash
cd streamlit-v0
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/streamlit run app.py
```

Opens at http://localhost:8501.
