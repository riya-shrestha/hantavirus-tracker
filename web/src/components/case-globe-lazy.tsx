"use client";

import dynamic from "next/dynamic";

// react-globe.gl uses Three.js / window / document, so SSR must be off.
export const CaseGlobeLazy = dynamic(
  () => import("./case-globe").then((mod) => mod.CaseGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] rounded-lg border border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
        Loading globe…
      </div>
    ),
  },
);
