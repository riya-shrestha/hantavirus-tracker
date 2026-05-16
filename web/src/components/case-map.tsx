"use client";

import {
  useMemo,
  useState,
  useRef,
  useCallback,
  useContext,
  createContext,
  type ReactNode,
} from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import MaplibreMap, {
  Marker,
  Source,
  Layer,
  NavigationControl,
  type LayerProps,
} from "react-map-gl/maplibre";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import {
  useFloating,
  useHover,
  useFocus,
  useInteractions,
  useDismiss,
  useRole,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  safePolygon,
  FloatingPortal,
  FloatingArrow,
} from "@floating-ui/react";
import type { Case, CaseType } from "@/lib/types";
import { countryCoords, countryName } from "@/data/country-coords";
import { usStateCoords } from "@/data/us-state-coords";
import { cityCoords } from "@/data/city-coords";
import { cruiseRoute } from "@/data/cruise-route";
import {
  passengerDestinations,
  type PassengerDestination,
} from "@/data/passenger-destinations";
import { darkSlateStyle } from "@/data/dark-slate-style";
import { pickTopSources, totalSourceCount } from "@/lib/source-tier";
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
  cases: Case[];
  primaryType: CaseType;
}

interface CaseMapProps {
  cases: Case[];
  onCountryClick?: (code: string) => void;
}

function caseTypeLabel(t: CaseType, count: number): string {
  if (t === "death") return count === 1 ? "death" : "deaths";
  if (t === "contact_monitoring")
    return count === 1
      ? "individual under monitoring"
      : "individuals under monitoring";
  return count === 1 ? `${t} case` : `${t} cases`;
}

interface ResolvedLocation {
  lat: number;
  lng: number;
  displayName: string;
  key: string; // aggregation key — cases with the same key collapse into one marker
  countryCode: string; // location country (may differ from attribution country)
}

/**
 * Resolve a case's PHYSICAL location for map plotting. Prefers the case's
 * own location_lat/location_lng; falls back to admin1 (US state) centroid;
 * finally to country centroid. Returns null if the case can't be plotted
 * (e.g., country=XX or location_specificity=unknown).
 */
function resolveLocation(c: Case): ResolvedLocation | null {
  // location_country defaults to attribution country if not set
  const locCountry = c.location_country ?? c.country;
  const locAdmin1 =
    c.location_admin1 ?? (c.country === "US" ? c.admin1 : null);
  const locCity = c.location_city ?? null;

  if (locCountry === "XX") return null;
  if (c.location_specificity === "unknown") return null;

  // 1) Use the case's own coords when available (city-level usually)
  if (c.location_lat != null && c.location_lng != null) {
    const cn = countryName(locCountry);
    let displayName: string;
    if (locCity && cityCoords[locCity]) {
      const ci = cityCoords[locCity];
      displayName = locAdmin1
        ? `${ci.display_name}, ${locAdmin1}, ${cn}`
        : `${ci.display_name}, ${cn}`;
    } else if (locAdmin1 && locCountry === "US" && usStateCoords[locAdmin1]) {
      displayName = `${usStateCoords[locAdmin1].name}, USA`;
    } else {
      displayName = cn;
    }
    return {
      lat: c.location_lat,
      lng: c.location_lng,
      displayName,
      key: `${locCountry}|${locAdmin1 ?? ""}|${locCity ?? ""}`,
      countryCode: locCountry,
    };
  }

  // 2) admin1 (US state) centroid fallback
  if (locAdmin1 && locCountry === "US" && usStateCoords[locAdmin1]) {
    const s = usStateCoords[locAdmin1];
    return {
      lat: s.lat,
      lng: s.lng,
      displayName: `${s.name}, USA`,
      key: `${locCountry}|${locAdmin1}|`,
      countryCode: locCountry,
    };
  }

  // 3) Country centroid fallback (also handles at_sea cases — they
  //    fall back to attribution country until we wire cruise_positions)
  if (countryCoords[locCountry]) {
    const ci = countryCoords[locCountry];
    return {
      lat: ci.lat,
      lng: ci.lng,
      displayName: ci.name,
      key: `${locCountry}||`,
      countryCode: locCountry,
    };
  }

  return null;
}

// Provides the map-container element to every HoverableMarker so its
// floating tooltip can use it as the flip/shift boundary. Without this,
// Floating UI clips against the viewport and the card escapes the map.
const MapBoundaryContext = createContext<HTMLElement | null>(null);

// ─────────────────────────────────────────────────────────────────────────
// Liquid-glass shell
// ─────────────────────────────────────────────────────────────────────────

function LiquidGlass({
  children,
  arrowSlot,
}: {
  children: ReactNode;
  arrowSlot?: ReactNode;
}) {
  return (
    <div className="relative overflow-visible">
      <div className="relative w-72 overflow-hidden rounded-2xl border border-white/15 dark:border-white/10 bg-background/30 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/5 dark:ring-white/5">
        {/* top-edge specular highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        {/* diagonal sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5" />
        <div className="relative p-3.5 text-foreground text-sm space-y-2.5">
          {children}
        </div>
      </div>
      {arrowSlot}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hover-controlled floating marker (Floating UI handles position + bridge)
// ─────────────────────────────────────────────────────────────────────────

interface HoverableMarkerProps {
  longitude: number;
  latitude: number;
  offset?: [number, number];
  trigger: ReactNode;
  panel: ReactNode;
}

function HoverableMarker({
  longitude,
  latitude,
  offset: markerOffset,
  trigger,
  panel,
}: HoverableMarkerProps) {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef<SVGSVGElement | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const boundary = useContext(MapBoundaryContext);

  // Arrow background — match the glass card's outer color (very translucent
  // so the gradient + blur on the card shows through).
  const arrowFill = isDark ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.45)";
  const arrowStroke = isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(0, 0, 0, 0.05)";

  // Recompute middleware when the boundary element becomes available, so flip
  // and shift can confine the card to the map container rather than the viewport.
  const middleware = useMemo(
    () => [
      offset(10),
      flip({
        boundary: boundary ?? undefined,
        fallbackPlacements: ["bottom", "right", "left"],
        padding: 8,
      }),
      shift({
        boundary: boundary ?? undefined,
        padding: 12,
      }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
    [boundary],
  );

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: "top",
    strategy: "fixed",
    middleware,
  });

  const hover = useHover(context, {
    move: false,
    handleClose: safePolygon({
      buffer: 4,
      blockPointerEvents: false,
    }),
    delay: { open: 60, close: 0 },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context, { escapeKey: true });
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="center"
      offset={markerOffset}
    >
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-block"
      >
        {trigger}
      </div>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 9999 }}
            {...getFloatingProps()}
          >
            <LiquidGlass
              arrowSlot={
                <FloatingArrow
                  ref={arrowRef}
                  context={context}
                  width={16}
                  height={8}
                  fill={arrowFill}
                  stroke={arrowStroke}
                  strokeWidth={1}
                />
              }
            >
              {panel}
            </LiquidGlass>
          </div>
        </FloatingPortal>
      )}
    </Marker>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Panel content components
// ─────────────────────────────────────────────────────────────────────────

function CaseSourceList({
  cases,
}: {
  cases: Case[];
}) {
  const top = pickTopSources(cases, 3);
  const totalCount = totalSourceCount(cases);
  if (top.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Sources ({totalCount})
      </p>
      <ul className="space-y-1">
        {top.map((s) => (
          <li key={s.url} className="text-xs leading-snug">
            <a
              href={s.url}
              target="_blank"
              rel="noopener"
              className="text-foreground/90 hover:underline"
              title={`${s.source_name} — ${s.title}`}
            >
              <span className="text-muted-foreground">{s.source_name}:</span>{" "}
              <span>{s.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CasePanel({ point }: { point: Point }) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const firstCase = point.cases[0];

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {point.name}
        </p>
        <CaseBadge type={point.primaryType} />
      </div>
      <p className="text-base font-semibold leading-tight">
        {point.count} {caseTypeLabel(point.primaryType, point.count)}
      </p>

      {/* Notes — collapsible inline */}
      <div className="space-y-1.5">
        {notesExpanded ? (
          // Expanded: full notes for every case row, scrollable if many
          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
            {point.cases.map((c, i) => (
              <div key={c.id} className="space-y-0.5">
                {point.cases.length > 1 && (
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Case {i + 1}
                  </p>
                )}
                <p className="text-sm text-foreground/90 leading-snug">
                  {c.notes}
                </p>
              </div>
            ))}
          </div>
        ) : (
          // Compact: up to 2 truncated notes (no bullet — line-clamp turned
          // the previous inline middot into an orphaned dot on its own line).
          <ul className="space-y-1.5">
            {point.cases.slice(0, 2).map((c) => (
              <li
                key={c.id}
                className="text-sm leading-snug text-foreground/85 line-clamp-2"
              >
                {c.notes}
              </li>
            ))}
            {point.cases.length > 2 && (
              <li className="text-xs text-muted-foreground italic">
                + {point.cases.length - 2} more case row
                {point.cases.length - 2 === 1 ? "" : "s"}
              </li>
            )}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setNotesExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 border border-white/10 rounded-md transition-colors"
        >
          <span>
            {notesExpanded
              ? "Show less"
              : point.cases.length > 1
                ? `Show full notes (${point.cases.length} cases)`
                : "Show full notes"}
          </span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${notesExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Sources — always visible */}
      <CaseSourceList cases={point.cases} />

      {/* CTA — always visible */}
      <Link
        href={`/cases/${firstCase.id}`}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-md transition-colors"
      >
        <span>
          {point.cases.length === 1
            ? "Open case page"
            : `Open case page (1 of ${point.cases.length})`}
        </span>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </>
  );
}

function PassengerPanel({ d }: { d: PassengerDestination }) {
  return (
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
}

// ─────────────────────────────────────────────────────────────────────────
// Main map component
// ─────────────────────────────────────────────────────────────────────────

export function CaseMap({ cases, onCountryClick }: CaseMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [projection, setProjection] = useState<"globe" | "mercator">("globe");
  // Ref-callback captures the map wrapper div so HoverableMarker can use it
  // as the Floating UI boundary for flip/shift collision detection.
  const [mapBoundary, setMapBoundary] = useState<HTMLElement | null>(null);
  const setMapBoundaryRef = useCallback((el: HTMLDivElement | null) => {
    setMapBoundary(el);
  }, []);

  // Helper: highest-severity case_type in a set for color/label selection
  const pickPrimary = (types: Set<CaseType>): CaseType =>
    types.has("death")
      ? "death"
      : types.has("confirmed")
        ? "confirmed"
        : types.has("probable")
          ? "probable"
          : "suspected";

  // CASE markers (confirmed / probable / suspected / death) aggregated by
  // PHYSICAL location (not attribution country). Two cases at the same
  // city/state collapse into one marker; hover card shows the breakdown.
  const casePoints = useMemo<Point[]>(() => {
    interface CaseLocationAccum {
      lat: number;
      lng: number;
      name: string;
      countryCode: string;
      count: number;
      types: Set<CaseType>;
      cases: Case[];
    }
    const byLocation = new Map<string, CaseLocationAccum>();

    for (const c of cases) {
      if (c.country === "XX") continue;
      if (c.case_type === "contact_monitoring") continue;
      // Skip cases that have been operationally excluded (e.g., later
      // tested negative). They stay in the dataset for audit but aren't
      // plotted as active cases.
      if (c.current_status === "excluded") continue;

      const loc = resolveLocation(c);
      if (!loc) continue;

      const existing = byLocation.get(loc.key);
      if (existing) {
        existing.count += c.case_count;
        existing.types.add(c.case_type);
        existing.cases.push(c);
      } else {
        byLocation.set(loc.key, {
          lat: loc.lat,
          lng: loc.lng,
          name: loc.displayName,
          countryCode: loc.countryCode,
          count: c.case_count,
          types: new Set([c.case_type]),
          cases: [c],
        });
      }
    }

    return Array.from(byLocation.entries()).map(([key, info]) => ({
      code: `case-${key}`,
      countryCode: info.countryCode,
      lat: info.lat,
      lng: info.lng,
      name: info.name,
      count: info.count,
      color: pickSeverity(info.types),
      cases: info.cases,
      primaryType: pickPrimary(info.types),
    }));
  }, [cases]);

  // MONITORING markers — same location-key aggregation, contact_monitoring only
  const monitoringPoints = useMemo<Point[]>(() => {
    interface MonLocationAccum {
      lat: number;
      lng: number;
      name: string;
      countryCode: string;
      count: number;
      cases: Case[];
    }
    const byLocation = new Map<string, MonLocationAccum>();

    for (const c of cases) {
      if (c.country === "XX") continue;
      if (c.case_type !== "contact_monitoring") continue;

      const loc = resolveLocation(c);
      if (!loc) continue;

      const existing = byLocation.get(loc.key);
      if (existing) {
        existing.count += c.case_count;
        existing.cases.push(c);
      } else {
        byLocation.set(loc.key, {
          lat: loc.lat,
          lng: loc.lng,
          name: loc.displayName,
          countryCode: loc.countryCode,
          count: c.case_count,
          cases: [c],
        });
      }
    }

    return Array.from(byLocation.entries()).map(([key, info]) => ({
      code: `mon-${key}`,
      countryCode: info.countryCode,
      lat: info.lat,
      lng: info.lng,
      name: info.name,
      count: info.count,
      color: MONITORING_COLOR,
      cases: info.cases,
      primaryType: "contact_monitoring" as CaseType,
    }));
  }, [cases]);

  // Passenger destination yellow dots — filter out countries/states that
  // already have a case or monitoring marker (location-based, not attribution).
  const passengerPoints = useMemo<PassengerDestination[]>(() => {
    return passengerDestinations.filter((d) => {
      const hasCaseHere = cases.some((c) => {
        if (c.current_status === "excluded") return false;
        if (c.country === "XX") return false;
        const cCountry = c.location_country ?? c.country;
        if (cCountry !== d.country) return false;
        if (d.admin1) {
          const cAdmin1 = c.location_admin1 ?? c.admin1;
          return cAdmin1 === d.admin1;
        }
        return true; // country-level passenger dot — any case in that country covers it
      });
      return !hasCaseHere;
    });
  }, [cases]);

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

  return (
    <MapBoundaryContext.Provider value={mapBoundary}>
    <div
      ref={setMapBoundaryRef}
      className="relative w-full h-[520px] rounded-lg overflow-hidden border border-border"
    >
      <MaplibreMap
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

        {/* Cruise waypoint dots (basic title tooltip) */}
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

        {/* Passenger destinations */}
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
            panel={<PassengerPanel d={d} />}
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
              panel={<CasePanel point={p} />}
            />
          );
        })}

        {/* Case markers — on top */}
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
              panel={<CasePanel point={p} />}
            />
          );
        })}
      </MaplibreMap>

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
    </MapBoundaryContext.Provider>
  );
}
