"use client";

import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { useTheme } from "next-themes";
import type { Case } from "@/lib/types";
import { countryCoords } from "@/data/country-coords";
import { usStateCoords } from "@/data/us-state-coords";
import { cruiseRoute } from "@/data/cruise-route";

const TOPO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// world-atlas TopoJSON uses country *names* in `properties.name`. We need
// alpha-2 codes to match our data. Extend as the dataset grows.
const NAME_TO_ISO2: Record<string, string> = {
  "United States of America": "US",
  Netherlands: "NL",
  "United Kingdom": "GB",
  Germany: "DE",
  Switzerland: "CH",
  "South Africa": "ZA",
  Argentina: "AR",
  Singapore: "SG",
  "Cape Verde": "CV",
  Spain: "ES",
  France: "FR",
};

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
  shortLabel: string;
  count: number;
  color: string;
}

interface CaseWorldMapProps {
  cases: Case[];
  onCountryClick?: (code: string) => void;
}

export function CaseWorldMap({ cases, onCountryClick }: CaseWorldMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Build points: split US cases by admin1, others by country
  const points = useMemo<Point[]>(() => {
    const usByState: Record<
      string,
      { count: number; types: Set<string> }
    > = {};
    const byCountry: Record<
      string,
      { count: number; types: Set<string> }
    > = {};

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
        shortLabel: stateCode,
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
        shortLabel: ci.name,
        count: info.count,
        color: pickSeverity(info.types),
      });
    }
    return out;
  }, [cases]);

  const countriesWithCases = useMemo(() => {
    const set = new Set<string>();
    for (const c of cases) if (c.country !== "XX") set.add(c.country);
    return set;
  }, [cases]);

  // Style tokens
  const affectedFill = isDark ? "#7f1d1d" : "#fecaca";
  const baseFill = isDark ? "#1e293b" : "#f1f5f9";
  const borderColor = isDark ? "#0f172a" : "#ffffff";
  const labelColor = isDark ? "#f8fafc" : "#0f172a";
  const labelMutedColor = isDark ? "#94a3b8" : "#64748b";
  const oceanColor = isDark ? "#0b1220" : "#e2e8f0";

  // Pre-compute marker radius: sqrt scale so big counts don't dwarf small
  const r = (count: number) => Math.max(4, Math.min(28, Math.sqrt(count) * 3.5));

  return (
    <div
      className="w-full rounded-lg border border-border overflow-hidden"
      style={{ background: oceanColor }}
    >
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={TOPO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const props: any = geo.properties;
              const name: string = props.name;
              const iso = NAME_TO_ISO2[name];
              const isAffected = iso && countriesWithCases.has(iso);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (iso) onCountryClick?.(iso);
                  }}
                  style={{
                    default: {
                      fill: isAffected ? affectedFill : baseFill,
                      stroke: borderColor,
                      strokeWidth: 0.6,
                      outline: "none",
                      cursor: iso ? "pointer" : "default",
                    },
                    hover: {
                      fill: isAffected
                        ? isDark
                          ? "#991b1b"
                          : "#fca5a5"
                        : isDark
                          ? "#334155"
                          : "#cbd5e1",
                      stroke: borderColor,
                      strokeWidth: 0.8,
                      outline: "none",
                    },
                    pressed: {
                      fill: affectedFill,
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Country name labels — only for affected countries to avoid clutter */}
        <Geographies geography={TOPO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const props: any = geo.properties;
              const iso = NAME_TO_ISO2[props.name];
              if (!iso || !countriesWithCases.has(iso)) return null;
              const centroid = geoCentroid(geo);
              if (!isFinite(centroid[0]) || !isFinite(centroid[1])) return null;
              return (
                <Marker
                  key={`label-${geo.rsmKey}`}
                  coordinates={centroid}
                >
                  <text
                    textAnchor="middle"
                    y={-16}
                    style={{
                      fontFamily: "system-ui, sans-serif",
                      fontSize: 9,
                      fontWeight: 600,
                      fill: labelColor,
                      pointerEvents: "none",
                      paintOrder: "stroke",
                      stroke: oceanColor,
                      strokeWidth: 3,
                      strokeLinejoin: "round",
                    }}
                  >
                    {props.name}
                  </text>
                </Marker>
              );
            })
          }
        </Geographies>

        {/* Cruise route: great-circle lines between consecutive waypoints */}
        {cruiseRoute.slice(0, -1).map((waypoint, i) => {
          const next = cruiseRoute[i + 1];
          return (
            <Line
              key={`arc-${i}`}
              from={[waypoint.lng, waypoint.lat]}
              to={[next.lng, next.lat]}
              stroke="#f59e0b"
              strokeWidth={1.6}
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          );
        })}

        {/* Waypoint markers (subtle) */}
        {cruiseRoute.map((wp, i) => (
          <Marker
            key={`wp-${i}`}
            coordinates={[wp.lng, wp.lat]}
            data-tip={wp.name}
          >
            <circle r={1.6} fill="#f59e0b" opacity={0.9} />
          </Marker>
        ))}

        {/* Case markers: proportional circles at country / state centroids */}
        {points.map((p) => (
          <Marker
            key={`pt-${p.code}`}
            coordinates={[p.lng, p.lat]}
            onClick={() => onCountryClick?.(p.countryCode)}
            style={{ default: { cursor: "pointer" } }}
          >
            <circle
              r={r(p.count)}
              fill={p.color}
              fillOpacity={0.75}
              stroke="#fff"
              strokeWidth={1.2}
            />
            <text
              textAnchor="middle"
              y={3}
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 10,
                fontWeight: 700,
                fill: "#fff",
                pointerEvents: "none",
                paintOrder: "stroke",
                stroke: p.color,
                strokeWidth: 0.5,
              }}
            >
              {p.count}
            </text>
            <title>
              {p.name} · {p.count} individual{p.count === 1 ? "" : "s"}
            </title>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
