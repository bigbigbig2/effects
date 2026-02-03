"use client";

import { useState } from "react";
import type { Project } from "../types";
import { TopNav } from "./ui/TopNav";
import { SideIndex } from "./ui/SideIndex";
import { Loading } from "./ui/Loading";
import { EnterOverlay } from "./ui/EnterOverlay";

type HUDProps = {
  projects: Project[];
};

export function HUD({ projects }: HUDProps) {
  const [enterVisible, setEnterVisible] = useState(true);
  const [soundOn, setSoundOn] = useState(false);

  const handleEnter = (withSound: boolean) => {
    setSoundOn(withSound);
    setEnterVisible(false);
  };

  return (
    <>
      <TopNav soundOn={soundOn} />
      <SideIndex projects={projects} />
      <Loading />
      <EnterOverlay
        isVisible={enterVisible}
        onEnter={() => handleEnter(true)}
        onEnterSilent={() => handleEnter(false)}
      />
    </>
  );
}
