"use client";

import { useMemo, useState, type ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import Map, {
  Marker,
  Source,
  Layer,
  NavigationControl,
  type LayerProps,
} from "react-map-gl/maplibre";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Case, CaseType } from "@/lib/types";
import { countryCoords } from "@/data/country-coords";
import { usStateCoords } from "@/data/us-state-coords";
import { cruiseRoute } from "@/data/cruise-route";
import {
  passengerDestinations,
  type PassengerDestination,
} from "@/data/passenger-destinations";
import { darkSlateStyle } from "@/data/dark-slate-style";
import { Button } from "@/components/ui/button";
import { CaseBadge } from "@/components/case-badge";

const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";

const SEVERITY_COLOR: Record<string, string> = {
  death: "#0f172a",
  confirmed: "#dc2626",
  probable: "#9333ea",
  suspected: "#f59e0b",
  contact_monitoring: "#3b82f6",
};
const MONITORING_COLOR = "#f97316";
const PASSENGER_COLOR = "#eab308";
const ROUTE_COLOR = "#f59e0b";

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
  cases: Case[]; // underlying case rows that fed this point
  primaryType: CaseType;
}

interface CaseMapProps {
  cases: Case[];
  onCountryClick?: (code: string) => void;
}

/**
 * Liquid-glass card rendered above a map marker.
 *
 * - Heavy backdrop blur + saturation boost
 * - Subtle specular highlight on the top edge
 * - Inner gradient sheen from top-left
 * - Soft inner ring for depth
 *
 * When `interactive` is false, the card has pointer-events-none so it never
 * blocks the underlying marker. When the user expands the card, it switches
 * to pointer-events-auto so they can interact (scroll, click links, toggle).
 */
function LiquidGlassCard({
  children,
  interactive,
  wide,
}: {
  children: ReactNode;
  interactive: boolean;
  wide: boolean;
}) {
  return (
    <div
      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 ${
        interactive ? "pointer-events-auto" : "pointer-events-none"
      } ${wide ? "w-80" : "w-72"}`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/15 dark:border-white/10 bg-background/30 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] ring-1 ring-black/5 dark:ring-white/5">
        {/* Top-edge specular highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        {/* Diagonal sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent dark:from-white/4" />
        {/* Content */}
        <div className="relative p-3.5 text-foreground text-sm space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Marker wrapper with a hoverable region, glass-card tooltip, and an
 * expand/collapse tab at the bottom. Expanded state bumps the marker's
 * outer z-index so sibling markers don't paint on top of the card.
 */
function HoverableMarker({
  longitude,
  latitude,
  offset,
  trigger,
  compact,
  expanded,
}: {
  longitude: number;
  latitude: number;
  offset?: [number, number];
  trigger: ReactNode;
  compact: ReactNode;
  expanded: ReactNode | null; // null = no expand-tab for this marker (e.g., passenger dots)
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const show = hovered || focused || isExpanded;
  const expandable = expanded != null;

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="center"
      offset={offset}
      // Bump z-index of the entire marker (and its tooltip) above siblings
      // when active. Without this, other markers paint on top of the card.
      style={{ zIndex: show ? 1000 : undefined }}
    >
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {trigger}
        {show && (
          <LiquidGlassCard
            interactive={isExpanded}
            wide={isExpanded}
          >
            {isExpanded ? expanded : compact}
            {expandable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((v) => !v);
                }}
                // pointer-events-auto so the button works even when the
                // surrounding card is pointer-events-none (compact state).
                className="pointer-events-auto group/expand mt-1 -mb-1 -mx-1 px-3 py-1.5 w-[calc(100%+0.5rem)] flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5 rounded-md transition-colors border-t border-white/10 dark:border-white/5"
              >
                <span>{isExpanded ? "Show less" : "Show full notes"}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </LiquidGlassCard>
        )}
      </div>
    </Marker>
  );
}

function caseTypeLabel(t: CaseType, count: number): string {
  if (t === "death") return count === 1 ? "death" : "deaths";
  if (t === "contact_monitoring")
    return count === 1 ? "individual under monitoring" : "individuals under monitoring";
  return count === 1 ? `${t} case` : `${t} cases`;
}

export function CaseMap({ cases, onCountryClick }: CaseMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [projection, setProjection] = useState<"globe" | "mercator">("globe");

  // CASE markers (confirmed / probable / suspected / death)
  const casePoints = useMemo<Point[]>(() => {
    const usByState: Record<
      string,
      { count: number; types: Set<CaseType>; cases: Case[] }
    > = {};
    const byCountry: Record<
      string,
      { count: number; types: Set<CaseType>; cases: Case[] }
    > = {};

    for (const c of cases) {
      if (c.country === "XX") continue;
      if (c.case_type === "contact_monitoring") continue;
      if (c.country === "US" && c.admin1 && usStateCoords[c.admin1]) {
        const e = (usByState[c.admin1] ??= {
          count: 0,
          types: new Set(),
          cases: [],
        });
        e.count += c.case_count;
        e.types.add(c.case_type);
        e.cases.push(c);
      } else if (countryCoords[c.country]) {
        const e = (byCountry[c.country] ??= {
          count: 0,
          types: new Set(),
          cases: [],
        });
        e.count += c.case_count;
        e.types.add(c.case_type);
        e.cases.push(c);
      }
    }

    const out: Point[] = [];
    for (const [stateCode, info] of Object.entries(usByState)) {
      const s = usStateCoords[stateCode];
      const primary: CaseType =
        info.types.has("death")
          ? "death"
          : info.types.has("confirmed")
            ? "confirmed"
            : info.types.has("probable")
              ? "probable"
              : "suspected";
      out.push({
        code: `case-${stateCode}`,
        countryCode: "US",
        lat: s.lat,
        lng: s.lng,
        name: `${s.name}, USA`,
        count: info.count,
        color: pickSeverity(info.types),
        cases: info.cases,
        primaryType: primary,
      });
    }
    for (const [code, info] of Object.entries(byCountry)) {
      const ci = countryCoords[code];
      const primary: CaseType =
        info.types.has("death")
          ? "death"
          : info.types.has("confirmed")
            ? "confirmed"
            : info.types.has("probable")
              ? "probable"
              : "suspected";
      out.push({
        code: `case-${code}`,
        countryCode: code,
        lat: ci.lat,
        lng: ci.lng,
        name: ci.name,
        count: info.count,
        color: pickSeverity(info.types),
        cases: info.cases,
        primaryType: primary,
      });
    }
    return out;
  }, [cases]);

  // MONITORING markers
  const monitoringPoints = useMemo<Point[]>(() => {
    const usByState: Record<string, { count: number; cases: Case[] }> = {};
    const byCountry: Record<string, { count: number; cases: Case[] }> = {};

    for (const c of cases) {
      if (c.country === "XX") continue;
      if (c.case_type !== "contact_monitoring") continue;
      if (c.country === "US" && c.admin1 && usStateCoords[c.admin1]) {
        const e = (usByState[c.admin1] ??= { count: 0, cases: [] });
        e.count += c.case_count;
        e.cases.push(c);
      } else if (countryCoords[c.country]) {
        const e = (byCountry[c.country] ??= { count: 0, cases: [] });
        e.count += c.case_count;
        e.cases.push(c);
      }
    }

    const out: Point[] = [];
    for (const [stateCode, info] of Object.entries(usByState)) {
      const s = usStateCoords[stateCode];
      out.push({
        code: `mon-${stateCode}`,
        countryCode: "US",
        lat: s.lat,
        lng: s.lng,
        name: `${s.name}, USA`,
        count: info.count,
        color: MONITORING_COLOR,
        cases: info.cases,
        primaryType: "contact_monitoring",
      });
    }
    for (const [code, info] of Object.entries(byCountry)) {
      const ci = countryCoords[code];
      out.push({
        code: `mon-${code}`,
        countryCode: code,
        lat: ci.lat,
        lng: ci.lng,
        name: ci.name,
        count: info.count,
        color: MONITORING_COLOR,
        cases: info.cases,
        primaryType: "contact_monitoring",
      });
    }
    return out;
  }, [cases]);

  // Set of regions already covered by case/monitoring markers, so passenger
  // dots don't duplicate.
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

  const passengerPoints = useMemo<PassengerDestination[]>(() => {
    return passengerDestinations.filter((d) => {
      const k = d.admin1 ? `${d.country}|${d.admin1}` : `${d.country}|`;
      return !occupied.has(k);
    });
  }, [occupied]);

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

  const mapStyle = isDark ? darkSlateStyle : STYLE_LIGHT;
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

  // ---- Tooltip content builders ----

  const totalSources = (p: Point) =>
    p.cases.reduce((s, c) => s + c.source_articles.length, 0);

  // Compact tooltip — short, glanceable.
  const renderCasesCompact = (p: Point) => (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {p.name}
        </p>
        <CaseBadge type={p.primaryType} />
      </div>
      <p className="text-base font-semibold">
        {p.count} {caseTypeLabel(p.primaryType, p.count)}
      </p>
      <ul className="space-y-1.5 text-sm text-foreground/85">
        {p.cases.slice(0, 2).map((c) => (
          <li key={c.id} className="leading-snug">
            <span className="text-muted-foreground">·</span>{" "}
            <span className="line-clamp-2">{c.notes}</span>
          </li>
        ))}
        {p.cases.length > 2 && (
          <li className="text-xs text-muted-foreground italic">
            + {p.cases.length - 2} more case row
            {p.cases.length - 2 === 1 ? "" : "s"}
          </li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground pt-1.5 border-t border-white/10">
        {totalSources(p)} source article
        {totalSources(p) === 1 ? "" : "s"}
      </p>
    </>
  );

  // Expanded tooltip — full notes, all sources, link to detail page.
  const renderCasesExpanded = (p: Point) => (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {p.name}
        </p>
        <CaseBadge type={p.primaryType} />
      </div>
      <p className="text-base font-semibold">
        {p.count} {caseTypeLabel(p.primaryType, p.count)}
      </p>
      <div className="max-h-72 overflow-y-auto space-y-3 -mx-1 px-1">
        {p.cases.map((c, i) => (
          <div key={c.id} className="space-y-1.5">
            {p.cases.length > 1 && (
              <p className="text-xs font-medium text-muted-foreground">
                Case {i + 1}
              </p>
            )}
            <p className="text-sm text-foreground/90 leading-snug">
              {c.notes}
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5 pl-2">
              {c.source_articles.map((src) => (
                <li key={src.url} className="truncate">
                  <span className="text-foreground/70">{src.source_name}:</span>{" "}
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener"
                    className="hover:text-foreground hover:underline"
                  >
                    {src.title}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground/80">
              Reported {c.date_reported}
            </p>
          </div>
        ))}
      </div>
      {p.cases.length > 0 && (
        <Link
          href={`/cases/${p.cases[0].id}`}
          onClick={(e) => e.stopPropagation()}
          className="block text-xs text-muted-foreground hover:text-foreground underline pt-1.5 border-t border-white/10"
        >
          {p.cases.length === 1
            ? "Open full case page →"
            : `Open first case page → (${p.cases.length} rows total)`}
        </Link>
      )}
    </>
  );

  const renderPassengerCompact = (d: PassengerDestination) => (
    <>
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: PASSENGER_COLOR }}
        />
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Passenger destination
        </p>
      </div>
      <p className="text-base font-semibold">{d.label}</p>
      <p className="text-sm text-foreground/85 leading-snug">{d.note}</p>
      <p className="text-xs text-muted-foreground pt-1.5 border-t border-white/10">
        No confirmed cases yet
      </p>
    </>
  );

  return (
    <div className="relative w-full h-[520px] rounded-lg overflow-hidden border border-border">
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

        {/* Cruise waypoint dots (basic title tooltip, no glass card) */}
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

        {/* Passenger-destination yellow dots */}
        {passengerPoints.map((d) => (
          <HoverableMarker
            key={`pax-${d.country}-${d.admin1 ?? ""}`}
            longitude={d.lng}
            latitude={d.lat}
            trigger={
              <div
                className="rounded-full shadow-md cursor-help"
                style={{
                  width: 12,
                  height: 12,
                  background: PASSENGER_COLOR,
                  border: "1.5px solid white",
                }}
              />
            }
            compact={renderPassengerCompact(d)}
            expanded={null}
          />
        ))}

        {/* Monitoring markers (orange) */}
        {monitoringPoints.map((p) => {
          const size = markerSize(p.count);
          return (
            <HoverableMarker
              key={p.code}
              longitude={p.lng}
              latitude={p.lat}
              offset={[size * 0.7, size * 0.4]}
              trigger={
                <button
                  type="button"
                  onClick={() => onCountryClick?.(p.countryCode)}
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
              }
              compact={renderCasesCompact(p)}
              expanded={renderCasesExpanded(p)}
            />
          );
        })}

        {/* Case markers — severity-colored, on top */}
        {casePoints.map((p) => {
          const size = markerSize(p.count);
          return (
            <HoverableMarker
              key={p.code}
              longitude={p.lng}
              latitude={p.lat}
              trigger={
                <button
                  type="button"
                  onClick={() => onCountryClick?.(p.countryCode)}
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
              }
              compact={renderCasesCompact(p)}
              expanded={renderCasesExpanded(p)}
            />
          );
        })}
      </Map>

      {/* Projection toggle */}
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

      {/* Legend */}
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
