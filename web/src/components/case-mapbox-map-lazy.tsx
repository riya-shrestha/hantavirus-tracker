"use client";

import dynamic from "next/dynamic";

// mapbox-gl uses WebGL and window APIs, so SSR is off.
export const CaseMapboxMapLazy = dynamic(
  () => import("./case-mapbox-map").then((mod) => mod.CaseMapboxMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-lg border border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);
