"use client";

import dynamic from "next/dynamic";

// react-simple-maps fetches TopoJSON on mount; rendering it client-only
// avoids a hydration mismatch (server: no geographies; client: geographies).
export const CaseWorldMapLazy = dynamic(
  () => import("./case-world-map").then((mod) => mod.CaseWorldMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[440px] rounded-lg border border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);
