import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground space-y-1">
        <p>
          MV Hondius / Andes virus 2026 outbreak tracker. Hand-curated from CDC HAN, WHO DON, ECDC, and major news outlets.
        </p>
        <p>
          Headline counts match WHO 2026-DON601 (May 13). See{" "}
          <Link href="/methodology" className="underline hover:text-foreground">
            methodology
          </Link>{" "}
          and{" "}
          <Link href="/sources" className="underline hover:text-foreground">
            sources
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
