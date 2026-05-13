import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/cases", label: "Cases" },
  { href: "/sources", label: "Sources" },
  { href: "/methodology", label: "Methodology" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight hover:opacity-80"
        >
          MV Hondius Tracker
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Andes virus 2026
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-4 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
