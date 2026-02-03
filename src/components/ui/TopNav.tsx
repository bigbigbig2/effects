"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TopNavProps = {
  soundOn?: boolean;
};

export function TopNav({ soundOn = false }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="top-nav">
      <div className="brand">
        <span>Rogier de Boeve</span>
        <span className="role">Portfolio 2024</span>
      </div>
      <nav className="links">
        <Link className={pathname === "/" ? "is-active" : ""} href="/">
          Work
        </Link>
        <Link className={pathname === "/about" ? "is-active" : ""} href="/about">
          About
        </Link>
      </nav>
      <div className="meta">
        <span className="dot"></span>
        <span>Sound {soundOn ? "On" : "Off"}</span>
      </div>
    </header>
  );
}
