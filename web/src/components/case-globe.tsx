"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { useTheme } from "next-themes";
import type { Case } from "@/lib/types";
import { countryCoords } from "@/data/country-coords";
import { cruiseRoute } from "@/data/cruise-route";

interface CaseGlobeProps {
  cases: Case[];
  onCountryClick?: (countryCode: string) => void;
}

// Severity colors for bars (matches Tailwind palette so it harmonizes with the rest of the UI).
const SEVERITY_COLOR: Record<string, string> = {
  death: "#0f172a", // slate-900
  confirmed: "#dc2626", // red-600
  probable: "#9333ea", // purple-600
  suspected: "#f59e0b", // amber-500
  contact_monitoring: "#3b82f6", // blue-500
};

function pickSeverity(types: Set<string>): string {
  // Worst-severity wins for the bar color
  if (types.has("death")) return SEVERITY_COLOR.death;
  if (types.has("confirmed")) return SEVERITY_COLOR.confirmed;
  if (types.has("probable")) return SEVERITY_COLOR.probable;
  if (types.has("suspected")) return SEVERITY_COLOR.suspected;
  return SEVERITY_COLOR.contact_monitoring;
}

export function CaseGlobe({ cases, onCountryClick }: CaseGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 800, height: 480 });
  const { resolvedTheme } = useTheme();

  // Build per-country aggregates: total case_count and severity color
  const points = useMemo(() => {
    const byCountry: Record<
      string,
      { count: number; types: Set<string>; cases: Case[] }
    > = {};
    for (const c of cases) {
      if (c.country === "XX" || !countryCoords[c.country]) continue;
      const entry = (byCountry[c.country] ??= {
        count: 0,
        types: new Set(),
        cases: [],
      });
      entry.count += c.case_count;
      entry.types.add(c.case_type);
      entry.cases.push(c);
    }
    return Object.entries(byCountry).map(([code, info]) => ({
      code,
      lat: countryCoords[code].lat,
      lng: countryCoords[code].lng,
      name: countryCoords[code].name,
      count: info.count,
      color: pickSeverity(info.types),
      cases: info.cases,
    }));
  }, [cases]);

  // Build cruise route as a series of arcs between consecutive waypoints
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

  const globeImage =
    resolvedTheme === "dark"
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
        showAtmosphere={true}
        atmosphereColor={resolvedTheme === "dark" ? "#60a5fa" : "#3b82f6"}
        atmosphereAltitude={0.15}
        // Bars sized by case count
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = d as any;
          return Math.max(0.04, Math.min(0.4, p.count * 0.012));
        }}
        pointRadius={0.45}
        pointColor={(d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (d as any).color;
        }}
        pointLabel={(d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = d as any;
          return `<div style="background:#0f172a;color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;font-family:system-ui">
            <div style="font-weight:600">${p.name}</div>
            <div>${p.count} case${p.count === 1 ? "" : "s"}</div>
          </div>`;
        }}
        onPointClick={(d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = d as any;
          onCountryClick?.(p.code);
        }}
        // Cruise route arcs
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
        arcLabel={(d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (d as any).label;
        }}
      />
    </div>
  );
}
