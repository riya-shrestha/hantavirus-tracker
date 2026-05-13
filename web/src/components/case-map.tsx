"use client";

import { useMemo, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import Map, {
  Marker,
  Source,
  Layer,
  NavigationControl,
  type LayerProps,
} from "react-map-gl/maplibre";
import { useTheme } from "next-themes";
import type { Case } from "@/lib/types";
import { countryCoords } from "@/data/country-coords";
import { usStateCoords } from "@/data/us-state-coords";
import { cruiseRoute } from "@/data/cruise-route";
import { Button } from "@/components/ui/button";

// OpenFreeMap — free vector tile hosting, no API key.
// https://openfreemap.org
const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark-matter";

const SEVERITY_COLOR: Record<string, string> = {
  death: "#0f172a",
  confirmed: "#dc2626",
  probable: "#9333ea",
  suspected: "#f59e0b",
  contact_monitoring: "#3b82f6",
};

function pickSeverity(types: Set<string>): string {
  if (types.has("death")) return SEVERITY_COLOR.death;
  if (types.has("confirmed")) return SEVERITY_COLOR.confirmed;
  if (types.has("probable")) return SEVERITY_COLOR.probable;
  if (types.has("suspected")) return SEVERITY_COLOR.suspected;
  return SEVERITY_COLOR.contact_monitoring;
}

interface Point {
  type: "state" | "country";
  code: string;
  countryCode: string;
  lat: number;
  lng: number;
  name: string;
  count: number;
  color: string;
}

interface CaseMapProps {
  cases: Case[];
  onCountryClick?: (code: string) => void;
}

export function CaseMap({ cases, onCountryClick }: CaseMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [projection, setProjection] = useState<"globe" | "mercator">("globe");

  // Build per-region points (US split by state, others by country).
  const points = useMemo<Point[]>(() => {
    const usByState: Record<string, { count: number; types: Set<string> }> = {};
    const byCountry: Record<string, { count: number; types: Set<string> }> = {};

    for (const c of cases) {
      if (c.country === "XX") continue;
      if (c.country === "US" && c.admin1 && usStateCoords[c.admin1]) {
        const e = (usByState[c.admin1] ??= { count: 0, types: new Set() });
        e.count += c.case_count;
        e.types.add(c.case_type);
      } else if (countryCoords[c.country]) {
        const e = (byCountry[c.country] ??= { count: 0, types: new Set() });
        e.count += c.case_count;
        e.types.add(c.case_type);
      }
    }

    const out: Point[] = [];
    for (const [stateCode, info] of Object.entries(usByState)) {
      const s = usStateCoords[stateCode];
      out.push({
        type: "state",
        code: stateCode,
        countryCode: "US",
        lat: s.lat,
        lng: s.lng,
        name: `${s.name}, USA`,
        count: info.count,
        color: pickSeverity(info.types),
      });
    }
    for (const [code, info] of Object.entries(byCountry)) {
      const ci = countryCoords[code];
      out.push({
        type: "country",
        code,
        countryCode: code,
        lat: ci.lat,
        lng: ci.lng,
        name: ci.name,
        count: info.count,
        color: pickSeverity(info.types),
      });
    }
    return out;
  }, [cases]);

  // Cruise route as a GeoJSON LineString
  const cruiseRouteGeoJSON = useMemo<GeoJSON.Feature>(
    () => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: cruiseRoute.map((wp) => [wp.lng, wp.lat]),
      },
    }),
    [],
  );

  const mapStyle = isDark ? STYLE_DARK : STYLE_LIGHT;

  const cruiseLineLayer: LayerProps = {
    id: "cruise-route-line",
    type: "line",
    paint: {
      "line-color": "#f59e0b",
      "line-width": 2,
      "line-dasharray": [3, 2],
      "line-opacity": 0.9,
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  };

  const markerSize = (count: number) =>
    Math.max(18, Math.min(56, Math.sqrt(count) * 9));

  return (
    <div className="relative w-full h-[520px] rounded-lg overflow-hidden border border-border">
      <Map
        initialViewState={{
          longitude: -8,
          latitude: 20,
          zoom: 1.8,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        projection={
          projection === "globe" ? { type: "globe" } : { type: "mercator" }
        }
        renderWorldCopies={projection === "mercator"}
        minZoom={0.5}
        maxZoom={8}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Cruise route polyline */}
        <Source id="cruise-route" type="geojson" data={cruiseRouteGeoJSON}>
          <Layer {...cruiseLineLayer} />
        </Source>

        {/* Cruise waypoint dots */}
        {cruiseRoute.map((wp, i) => (
          <Marker
            key={`wp-${i}`}
            longitude={wp.lng}
            latitude={wp.lat}
            anchor="center"
          >
            <div
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "#f59e0b",
                border: "1.5px solid white",
                boxShadow: "0 0 0 0.5px rgba(0,0,0,0.2)",
              }}
              title={wp.name}
            />
          </Marker>
        ))}

        {/* Case markers — proportional circles with count inside */}
        {points.map((p) => {
          const size = markerSize(p.count);
          return (
            <Marker
              key={`pt-${p.code}`}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
            >
              <button
                type="button"
                onClick={() => onCountryClick?.(p.countryCode)}
                title={`${p.name}: ${p.count} individual${p.count === 1 ? "" : "s"}`}
                className="flex items-center justify-center font-bold text-white shadow-md cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                style={{
                  width: size,
                  height: size,
                  background: p.color,
                  borderRadius: "9999px",
                  border: "2px solid white",
                  fontSize: size > 28 ? 14 : 11,
                  lineHeight: 1,
                }}
                aria-label={`${p.name}: ${p.count} cases`}
              >
                {p.count}
              </button>
            </Marker>
          );
        })}
      </Map>

      {/* Projection toggle, overlaid */}
      <div className="absolute top-3 left-3 z-10">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            setProjection(projection === "globe" ? "mercator" : "globe")
          }
          className="shadow-md"
        >
          {projection === "globe" ? "Flat view" : "Globe view"}
        </Button>
      </div>

      {/* Legend, overlaid bottom-left */}
      <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-md border border-border px-3 py-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: SEVERITY_COLOR.death }}
          />
          <span className="text-muted-foreground">Deaths</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: SEVERITY_COLOR.confirmed }}
          />
          <span className="text-muted-foreground">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: SEVERITY_COLOR.probable }}
          />
          <span className="text-muted-foreground">Probable</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: SEVERITY_COLOR.contact_monitoring }}
          />
          <span className="text-muted-foreground">Monitoring</span>
        </div>
      </div>
    </div>
  );
}
