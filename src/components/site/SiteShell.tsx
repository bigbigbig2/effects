import type { ReactNode } from "react";
import { Preloader } from "./Preloader";
import { SiteHeader } from "./SiteHeader";
import { SiteNav } from "./SiteNav";
import { SoundToggle } from "./SoundToggle";
import { ExperienceGate } from "./ExperienceGate";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <>
      <ExperienceGate />
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
