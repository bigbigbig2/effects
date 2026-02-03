"use client";

import { usePathname } from "next/navigation";
import { ExperienceMount } from "../ExperienceMount";
import { useUiState } from "./UiStateProvider";

export function ExperienceGate() {
  const pathname = usePathname();
  const { entered } = useUiState();
  const isHome = pathname === "/";

  if (!isHome || !entered) {
    return null;
  }

  return <ExperienceMount />;
}
