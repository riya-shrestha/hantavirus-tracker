"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { useTheme } from "next-themes";
import type { Case } from "@/lib/types";
import { countryCoords } from "@/data/country-coords";
import { usStateCoords } from "@/data/us-state-coords";
import { cruiseRoute } from "@/data/cruise-route";

interface CaseGlobeProps {
  cases: Case[];
  onCountryClick?: (countryCode: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFeature = any;

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

export function CaseGlobe({ cases, onCountryClick }: CaseGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 800, height: 480 });
  const [countries, setCountries] = useState<AnyFeature[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Fetch country polygons (Natural Earth 110m via three-globe's bundled dataset)
  useEffect(() => {
    let cancelled = false;
    fetch(
      "//unpkg.com/three-globe/example/datasets/ne_110m_admin_0_countries.geojson",
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCountries(data.features || []);
      })
      .catch(() => {
        // Boundaries are decorative — silent fail is fine.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Build bar points: split US cases by admin1 (state), everything else by country.
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

  // Track which countries have *any* cases (for polygon highlighting + label
  // rendering decisions).
  const countriesWithCases = useMemo(() => {
    const set = new Set<string>();
    for (const c of cases) if (c.country !== "XX") set.add(c.country);
    return set;
  }, [cases]);

  // Cruise route as a series of arcs between consecutive waypoints.
  const arcs = useMemo(() => {
    const out: {
      startLat: number;
      startLng: number;
      endLat: number;
      endLng: number;
      label: string;
    }[] = [];
    for (let i = 0; i < cruiseRoute.length - 1; i++) {
      const a = cruiseRoute[i];
      const b = cruiseRoute[i + 1];
      out.push({
        startLat: a.lat,
        startLng: a.lng,
        endLat: b.lat,
        endLng: b.lng,
        label: `${a.name} → ${b.name}`,
      });
    }
    return out;
  }, []);

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setSize({ width, height: Math.min(560, Math.max(380, width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-rotate when idle
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
    }
  }, []);

  const globeImage = isDark
    ? "//unpkg.com/three-globe/example/img/earth-night.jpg"
    : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg border border-border overflow-hidden bg-background"
      style={{ height: size.height }}
    >
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        globeImageUrl={globeImage}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor={isDark ? "#60a5fa" : "#3b82f6"}
        atmosphereAltitude={0.15}
        // --- Country boundaries ---
        polygonsData={countries}
        polygonAltitude={0.006}
        polygonCapColor={(f) => {
          const iso = (f as AnyFeature)?.properties?.ISO_A2;
          if (iso && countriesWithCases.has(iso)) {
            return isDark
              ? "rgba(220, 38, 38, 0.22)"
              : "rgba(220, 38, 38, 0.18)";
          }
          return isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";
        }}
        polygonSideColor={() =>
          isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
        }
        polygonStrokeColor={(f) => {
          const iso = (f as AnyFeature)?.properties?.ISO_A2;
          if (iso && countriesWithCases.has(iso)) {
            return isDark ? "rgba(252, 165, 165, 0.7)" : "rgba(185, 28, 28, 0.7)";
          }
          return isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
        }}
        polygonLabel={(f) => {
          const props = (f as AnyFeature)?.properties || {};
          const name = props.ADMIN || props.NAME || props.NAME_LONG || "?";
          const iso = props.ISO_A2;
          const labelBg = isDark ? "#1e293b" : "#0f172a";
          if (iso && countriesWithCases.has(iso)) {
            // Sum case_count for this country across all rows
            const count = cases
              .filter((c) => c.country === iso)
              .reduce((s, c) => s + c.case_count, 0);
            return `<div style="background:${labelBg};color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;font-family:system-ui">
              <div style="font-weight:600">${name}</div>
              <div>${count} individual${count === 1 ? "" : "s"}</div>
            </div>`;
          }
          return `<div style="background:${labelBg};color:#fff;padding:4px 8px;border-radius:6px;font-size:11px;font-family:system-ui">${name}</div>`;
        }}
        // --- Case bars (country- or state-level) ---
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(d) =>
          Math.max(0.04, Math.min(0.4, (d as Point).count * 0.012))
        }
        pointRadius={0.4}
        pointColor={(d) => (d as Point).color}
        pointLabel={(d) => {
          const p = d as Point;
          const bg = isDark ? "#1e293b" : "#0f172a";
          return `<div style="background:${bg};color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;font-family:system-ui">
            <div style="font-weight:600">${p.name}</div>
            <div>${p.count} individual${p.count === 1 ? "" : "s"}</div>
          </div>`;
        }}
        onPointClick={(d) => {
          const p = d as Point;
          onCountryClick?.(p.countryCode);
        }}
        // --- Always-visible labels next to bars ---
        labelsData={points}
        labelLat="lat"
        labelLng="lng"
        labelText={(d) => {
          const p = d as Point;
          return `${p.shortLabel} ${p.count}`;
        }}
        labelSize={0.5}
        labelDotRadius={0.15}
        labelColor={() => (isDark ? "#f8fafc" : "#0f172a")}
        labelResolution={2}
        labelAltitude={(d) =>
          Math.max(0.05, Math.min(0.42, (d as Point).count * 0.012)) + 0.01
        }
        // --- Cruise route arcs ---
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={() => "#f59e0b"}
        arcStroke={0.4}
        arcDashLength={0.4}
        arcDashGap={0.15}
        arcDashAnimateTime={3000}
        arcAltitude={0.18}
        arcLabel={(d) =>
          (d as { label: string }).label
        }
      />
    </div>
  );
}
