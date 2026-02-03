"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type SoundSetDetail = {
  enabled: boolean;
};

type UiState = {
  entered: boolean;
  enter: (withSound: boolean) => void;
};

const UiStateContext = createContext<UiState | null>(null);

export function UiStateProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (!isHome) {
      root.classList.remove("is-locked");
      root.classList.add("is-entered");
      return;
    }

    if (entered) {
      root.classList.remove("is-locked");
      root.classList.add("is-entered");
    } else {
      root.classList.add("is-locked");
      root.classList.remove("is-entered");
    }
  }, [entered, isHome]);

  const enter = useCallback((withSound: boolean) => {
    setEntered(true);
    const detail: SoundSetDetail = { enabled: withSound };
    window.dispatchEvent(new CustomEvent<SoundSetDetail>("sound:set", { detail }));
  }, []);

  const value = useMemo(
    () => ({
      entered,
      enter,
    }),
    [entered, enter]
  );

  return <UiStateContext.Provider value={value}>{children}</UiStateContext.Provider>;
}

export function useUiState() {
  const context = useContext(UiStateContext);
  if (!context) {
    throw new Error("useUiState must be used within UiStateProvider");
  }
  return context;
}
