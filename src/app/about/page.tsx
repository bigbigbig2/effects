import { SiteShell } from "../../components/site/SiteShell";
import { AboutView } from "../../components/site/AboutView";

export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <SiteShell>
      <AboutView />
    </SiteShell>
  );
}
