// Custom MapLibre style — slate-toned dark mode that matches the shadcn
// dark theme (oklch slate-700/800/900).
//
// Uses OpenFreeMap's planet vector tiles + their hosted glyphs, but defines
// our own layer set explicitly so we know what colors we're getting. This
// avoids the "dark-matter is near-black" problem.
//
// Schema: OpenMapTiles (source-layer names like water, landcover, boundary,
// place, etc.) — same as what OpenFreeMap serves.

import type { StyleSpecification } from "maplibre-gl";

export const darkSlateStyle: StyleSpecification = {
  version: 8,
  name: "Slate Dark",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
  },
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  layers: [
    // Background fills everything not covered by other layers — this is
    // effectively the "land" color since we don't draw a continent fill.
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#334155" }, // slate-700
    },

    // Water bodies (oceans, lakes, large rivers as polygons)
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: {
        "fill-color": "#0f172a", // slate-900
        "fill-antialias": true,
      },
    },

    // Landcover (forests, deserts, glaciers) — subtle tint above background
    {
      id: "landcover",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      paint: {
        "fill-color": "#3f4d63",
        "fill-opacity": 0.4,
      },
    },

    // Parks — gentle green tint for contrast
    {
      id: "park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: {
        "fill-color": "#39564a",
        "fill-opacity": 0.35,
      },
    },

    // Country borders (admin level 2)
    {
      id: "boundary_country",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: ["==", ["get", "admin_level"], 2],
      paint: {
        "line-color": "#94a3b8", // slate-400 — clearly visible
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          0.6,
          4,
          1,
          8,
          1.5,
        ],
        "line-opacity": 0.85,
      },
    },

    // State / province borders (admin level 4)
    {
      id: "boundary_state",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: ["==", ["get", "admin_level"], 4],
      paint: {
        "line-color": "#64748b", // slate-500
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          2,
          0.3,
          6,
          0.8,
        ],
        "line-opacity": 0.55,
      },
    },

    // Country labels — bright and readable
    {
      id: "place_country",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", ["get", "class"], "country"],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Bold"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          1,
          10,
          4,
          14,
        ],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.08,
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#e2e8f0", // slate-200
        "text-halo-color": "#0f172a",
        "text-halo-width": 1.5,
      },
    },

    // State / region labels (visible at zoom 3+)
    {
      id: "place_state",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", ["get", "class"], "state"],
      minzoom: 3,
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3,
          9,
          6,
          13,
        ],
      },
      paint: {
        "text-color": "#cbd5e1", // slate-300
        "text-halo-color": "#0f172a",
        "text-halo-width": 1.2,
      },
    },

    // City labels (zoom 4+)
    {
      id: "place_city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", ["get", "class"], "city"],
      minzoom: 4,
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4,
          10,
          8,
          14,
        ],
      },
      paint: {
        "text-color": "#94a3b8", // slate-400
        "text-halo-color": "#0f172a",
        "text-halo-width": 1,
      },
    },
  ],
};
