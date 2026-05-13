"""MV Hondius / Andes Virus 2026 Outbreak Tracker - v0 hand-curated MVP."""

import json
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

DATA_PATH = Path(__file__).parent.parent / "data" / "cases.json"

COUNTRY_NAMES = {
    "US": "United States",
    "CH": "Switzerland",
    "DE": "Germany",
    "NL": "Netherlands",
    "GB": "United Kingdom",
    "ZA": "South Africa",
    "SG": "Singapore",
    "CV": "Cape Verde",
    "AR": "Argentina",
}

COUNTRY_ISO3 = {
    "US": "USA",
    "CH": "CHE",
    "DE": "DEU",
    "NL": "NLD",
    "GB": "GBR",
    "ZA": "ZAF",
    "SG": "SGP",
    "CV": "CPV",
    "AR": "ARG",
}


def load_cases():
    with open(DATA_PATH) as f:
        return json.load(f)


def headline_counts(cases):
    confirmed = sum(c["case_count"] for c in cases if c["case_type"] == "confirmed")
    probable = sum(c["case_count"] for c in cases if c["case_type"] == "probable")
    suspected = sum(c["case_count"] for c in cases if c["case_type"] == "suspected")
    deaths = sum(c["case_count"] for c in cases if c["case_type"] == "death")
    monitoring = sum(
        c["case_count"] for c in cases if c["case_type"] == "contact_monitoring"
    )
    countries = len({c["country"] for c in cases if c["country"] != "XX"})
    return confirmed, probable, suspected, deaths, monitoring, countries


def country_totals(cases):
    rows = []
    for c in cases:
        if c["country"] == "XX":
            continue
        rows.append(
            {
                "country_code": c["country"],
                "country_name": COUNTRY_NAMES.get(c["country"], c["country"]),
                "iso3": COUNTRY_ISO3.get(c["country"], c["country"]),
                "case_count": c["case_count"],
            }
        )
    df = pd.DataFrame(rows)
    return df.groupby(
        ["country_code", "country_name", "iso3"], as_index=False
    )["case_count"].sum()


st.set_page_config(
    page_title="MV Hondius / Andes Virus 2026 Outbreak Tracker",
    page_icon="🦠",
    layout="wide",
)

st.title("MV Hondius / Andes Virus 2026 Outbreak Tracker")
st.caption(
    "Tracking the human-to-human Andes virus cluster from the April 2026 "
    "MV Hondius cruise ship outbreak."
)

cases = load_cases()
confirmed, probable, suspected, deaths, monitoring, countries = headline_counts(cases)

col1, col2, col3, col4, col5 = st.columns(5)
col1.metric("Confirmed", confirmed)
col2.metric("Probable", probable)
col3.metric("Deaths", deaths)
col4.metric("Under monitoring", monitoring, help="Asymptomatic contacts under public-health watch; not counted in WHO/ECDC headline cases")
col5.metric("Countries", countries)

st.caption(
    f"**Headline total (per WHO 2026-DON600 / ECDC May 12 2026):** "
    f"{confirmed + probable} confirmed/probable cases (incl. {deaths} deaths). "
    f"Contact-monitoring population shown separately."
)

st.subheader("Where cases have been reported")
df_countries = country_totals(cases)
fig = px.choropleth(
    df_countries,
    locations="iso3",
    color="case_count",
    hover_name="country_name",
    color_continuous_scale="Reds",
    locationmode="ISO-3",
    labels={"case_count": "Cases"},
)
fig.update_layout(
    margin=dict(l=0, r=0, t=0, b=0),
    height=480,
    geo=dict(showframe=False, showcoastlines=True, projection_type="natural earth"),
)
st.plotly_chart(fig, use_container_width=True)

st.subheader("All cases")
rows = []
for c in cases:
    src_links = " · ".join(
        f"[{s['source_name']}]({s['url']})" for s in c["source_articles"]
    )
    rows.append(
        {
            "Country": COUNTRY_NAMES.get(c["country"], c["country"]),
            "Region": c.get("admin1") or "—",
            "Type": c["case_type"],
            "Status": c["current_status"],
            "Count": c["case_count"],
            "Date reported": c["date_reported"],
            "Sources": src_links,
            "Notes": c.get("notes", ""),
        }
    )
df_cases = pd.DataFrame(rows)
st.markdown(df_cases.to_markdown(index=False), unsafe_allow_html=True)

st.divider()
st.caption(
    "Hand-curated from CDC HAN, WHO Disease Outbreak News, NPR, CNN, TODAY. "
    "Last updated 2026-05-11. This is a v0 manual tracker — automated extraction "
    "via news-article ingestion + LLM is in development. Methodology: only cases "
    "demonstrably linked to the MV Hondius cruise outbreak (passengers/crew or "
    "documented human-to-human transmission from a cruise case) are included."
)
