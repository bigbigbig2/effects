import { SiteShell } from "../../components/site/SiteShell";
import { ProjectView } from "../../components/site/ProjectView";

export const dynamic = "force-static";

export default function FilmSecessionPage() {
  return (
    <SiteShell>
      <ProjectView
        slug="filmsecession"
        title="Film Secession"
        description="Film Secession is an immersive museum without walls that continually opens up new connections between different filmmakers, periods & art forms."
        liveUrl="https://www.filmsecession.com/"
        info={[
          { title: "Client:", description: "Film Secession" },
          { title: "Agency:", description: "Poppr" },
          { title: "Role:", description: "Creative dev" },
          { title: "Year:", description: "2023" },
        ]}
        mediaDesktop={[
          {
            src: "/content/filmsecession/images/01.webp",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-start-7 lg:col-span-12",
          },
          {
            src: "/content/filmsecession/images/02.webp",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
          },
          {
            src: "/content/filmsecession/videos/01.mp4",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
            poster: "/content/filmsecession/images/01.webp",
          },
          {
            src: "/content/filmsecession/videos/02.mp4",
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
            poster: "/content/filmsecession/images/02.webp",
          },
        ]}
        mediaMobile={[
          {
            type: "picture",
            src: "/content/filmsecession/images/02.webp",
            alt: "Film Secession collage",
            width: 1600,
            height: 1140,
          },
          {
            type: "image",
            src: "/content/filmsecession/images/01.webp",
            alt: "project media",
            width: 1600,
            height: 1140,
          },
          {
            type: "image",
            src: "/content/filmsecession/images/02.webp",
            alt: "project media",
            width: 1600,
            height: 1140,
          },
        ]}
        next={{
          slug: "theroger",
          title: "The Roger",
          alt: "The Roger",
          image: {
            src: "/content/theroger/images/01.webp",
            width: 1600,
            height: 1140,
            className: "",
          },
        }}
      />
    </SiteShell>
  );
}
