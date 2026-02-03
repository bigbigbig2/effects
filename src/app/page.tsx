import { SiteShell } from "../components/site/SiteShell";
import { HomeView } from "../components/site/HomeView";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <SiteShell>
      <HomeView />
    </SiteShell>
  );
}
