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
import { passengerDestinations } from "@/data/passenger-destinations";
import { darkSlateStyle } from "@/data/dark-slate-style";
import { Button } from "@/components/ui/button";

// Light: OpenFreeMap's positron (clean, neutral, well-tuned).
// Dark: our own custom style — uses OpenFreeMap's vector tiles but with
// explicit slate colors so we know exactly what we're rendering.
const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";

// Distinct hues for the three marker types so they're easy to tell apart
const SEVERITY_COLOR: Record<string, string> = {
  death: "#0f172a", // slate-900
  confirmed: "#dc2626", // red-600
  probable: "#9333ea", // purple-600
  suspected: "#f59e0b", // amber-500 (currently unused at marker level)
  contact_monitoring: "#3b82f6", // blue-500 (legacy)
};
const MONITORING_COLOR = "#f97316"; // orange-500 — distinct from cruise route's amber
const PASSENGER_COLOR = "#eab308"; // yellow-500
const ROUTE_COLOR = "#f59e0b"; // amber-500

function pickSeverity(types: Set<string>): string {
  if (types.has("death")) return SEVERITY_COLOR.death;
  if (types.has("confirmed")) return SEVERITY_COLOR.confirmed;
  if (types.has("probable")) return SEVERITY_COLOR.probable;
  if (types.has("suspected")) return SEVERITY_COLOR.suspected;
  return SEVERITY_COLOR.contact_monitoring;
}

interface Point {
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

  // CASE markers (confirmed / probable / suspected / death) — match the headline.
  const casePoints = useMemo<Point[]>(() => {
    const usByState: Record<string, { count: number; types: Set<string> }> = {};
    const byCountry: Record<string, { count: number; types: Set<string> }> = {};

    for (const c of cases) {
      if (c.country === "XX") continue;
      if (c.case_type === "contact_monitoring") continue;
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
        code: `case-${stateCode}`,
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
        code: `case-${code}`,
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

  // MONITORING markers (contact_monitoring only) — orange, distinct from cases.
  const monitoringPoints = useMemo<Point[]>(() => {
    const usByState: Record<string, number> = {};
    const byCountry: Record<string, number> = {};

    for (const c of cases) {
      if (c.country === "XX") continue;
      if (c.case_type !== "contact_monitoring") continue;
      if (c.country === "US" && c.admin1 && usStateCoords[c.admin1]) {
        usByState[c.admin1] = (usByState[c.admin1] ?? 0) + c.case_count;
      } else if (countryCoords[c.country]) {
        byCountry[c.country] = (byCountry[c.country] ?? 0) + c.case_count;
      }
    }

    const out: Point[] = [];
    for (const [stateCode, count] of Object.entries(usByState)) {
      const s = usStateCoords[stateCode];
      out.push({
        code: `mon-${stateCode}`,
        countryCode: "US",
        lat: s.lat,
        lng: s.lng,
        name: `${s.name}, USA — under monitoring`,
        count,
        color: MONITORING_COLOR,
      });
    }
    for (const [code, count] of Object.entries(byCountry)) {
      const ci = countryCoords[code];
      out.push({
        code: `mon-${code}`,
        countryCode: code,
        lat: ci.lat,
        lng: ci.lng,
        name: `${ci.name} — under monitoring`,
        count,
        color: MONITORING_COLOR,
      });
    }
    return out;
  }, [cases]);

  // Set of "code|admin1" strings where a case or monitoring marker already lives,
  // so passenger destination yellow dots don't duplicate those locations.
  const occupied = useMemo(() => {
    const set = new Set<string>();
    for (const c of cases) {
      if (c.country === "XX") continue;
      const k =
        c.country === "US" && c.admin1
          ? `US|${c.admin1}`
          : `${c.country}|`;
      set.add(k);
    }
    return set;
  }, [cases]);

  const passengerPoints = useMemo(() => {
    return passengerDestinations.filter((d) => {
      const k = d.admin1 ? `${d.country}|${d.admin1}` : `${d.country}|`;
      return !occupied.has(k);
    });
  }, [occupied]);

  // Cruise route LineString
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

  // mapStyle is a string URL for light (positron from OpenFreeMap) and an
  // inline StyleSpecification object for dark (our slate style). MapLibre
  // accepts either.
  const mapStyle = isDark ? darkSlateStyle : STYLE_LIGHT;
  // Stable string key so the Map remounts cleanly when the theme toggles.
  const mapStyleKey = isDark ? "slate-dark" : "openfreemap-positron";

  const cruiseLineLayer: LayerProps = {
    id: "cruise-route-line",
    type: "line",
    paint: {
      "line-color": ROUTE_COLOR,
      "line-width": 2,
      "line-dasharray": [3, 2],
      "line-opacity": 0.9,
    },
    layout: { "line-cap": "round", "line-join": "round" },
  };

  const markerSize = (count: number) =>
    Math.max(18, Math.min(56, Math.sqrt(count) * 9));

  return (
    <div className="relative w-full h-[520px] rounded-lg overflow-hidden border border-border">
      {/* `key={mapStyleKey}` forces a clean remount when the user toggles
          light/dark, so MapLibre fully reloads the new style. */}
      <Map
        key={mapStyleKey}
        initialViewState={{ longitude: -8, latitude: 20, zoom: 1.8 }}
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
                background: ROUTE_COLOR,
                border: "1.5px solid white",
                boxShadow: "0 0 0 0.5px rgba(0,0,0,0.2)",
              }}
              title={wp.name}
            />
          </Marker>
        ))}

        {/* Passenger-destination yellow dots (rendered first so cases/monitoring
            sit on top when at the same point) */}
        {passengerPoints.map((d) => (
          <Marker
            key={`pax-${d.country}-${d.admin1 ?? ""}`}
            longitude={d.lng}
            latitude={d.lat}
            anchor="center"
          >
            <div
              className="rounded-full shadow-md"
              style={{
                width: 12,
                height: 12,
                background: PASSENGER_COLOR,
                border: "1.5px solid white",
              }}
              title={`${d.label} — ${d.note}`}
            />
          </Marker>
        ))}

        {/* Monitoring markers (orange) — offset slightly south-east so they
            don't fully cover a case marker at the same centroid */}
        {monitoringPoints.map((p) => {
          const size = markerSize(p.count);
          return (
            <Marker
              key={`mon-${p.code}`}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
              offset={[size * 0.7, size * 0.4]}
            >
              <button
                type="button"
                onClick={() => onCountryClick?.(p.countryCode)}
                title={`${p.name}: ${p.count} under monitoring`}
                className="flex items-center justify-center font-bold text-white shadow-md cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                style={{
                  width: size,
                  height: size,
                  background: MONITORING_COLOR,
                  borderRadius: "9999px",
                  border: "2px solid white",
                  fontSize: size > 28 ? 14 : 11,
                  lineHeight: 1,
                }}
                aria-label={`${p.name}: ${p.count} under monitoring`}
              >
                {p.count}
              </button>
            </Marker>
          );
        })}

        {/* Case markers — severity-colored, on top */}
        {casePoints.map((p) => {
          const size = markerSize(p.count);
          return (
            <Marker
              key={p.code}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
            >
              <button
                type="button"
                onClick={() => onCountryClick?.(p.countryCode)}
                title={`${p.name}: ${p.count} case${p.count === 1 ? "" : "s"}`}
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
      <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-md border border-border px-3 py-2 text-xs space-y-1.5">
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
            style={{ background: MONITORING_COLOR }}
          />
          <span className="text-muted-foreground">Under monitoring</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: PASSENGER_COLOR }}
          />
          <span className="text-muted-foreground">Passenger destination</span>
        </div>
        <div className="flex items-center gap-2 pt-0.5 border-t border-border/60">
          <span
            className="inline-block w-3 border-t-2 border-dashed"
            style={{ borderColor: ROUTE_COLOR }}
          />
          <span className="text-muted-foreground">Cruise route</span>
        </div>
      </div>
    </div>
  );
}
