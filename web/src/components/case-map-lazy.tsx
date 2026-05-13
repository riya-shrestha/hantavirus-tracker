"use client";

import dynamic from "next/dynamic";

// maplibre-gl uses WebGL and window APIs, so SSR is off.
export const CaseMapLazy = dynamic(
  () => import("./case-map").then((mod) => mod.CaseMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-lg border border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);
