import type { ReactNode } from "react";
import { ExperienceMount } from "../ExperienceMount";
import { Preloader } from "./Preloader";
import { SiteHeader } from "./SiteHeader";
import { SiteNav } from "./SiteNav";
import { SoundToggle } from "./SoundToggle";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <>
      <ExperienceMount />
      <div className="ui">
        <SiteHeader />
        <main className="ui-main">{children}</main>
        <SiteNav />
        <SoundToggle />
        <Preloader />
      </div>
    </>
  );
}
