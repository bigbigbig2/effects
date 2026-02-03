import { notFound } from "next/navigation";
import { SiteShell } from "../../components/site/SiteShell";
import { ProjectView } from "../../components/site/ProjectView";

const thumbMap: Record<string, string> = {
  "following-wildfire": "/images/thumbs/following-wildfire.webp",
  engaged: "/images/thumbs/engaged.webp",
  spritexmarvel: "/images/thumbs/spritexmarvel.webp",
  filmsecession: "/images/thumbs/filmsecession.webp",
  theroger: "/images/thumbs/the-roger.webp",
  poppr: "/images/thumbs/poppr.webp",
  demorgen: "/images/thumbs/de-morgen.webp",
  glenncatteeuw: "/images/thumbs/glenn-catteeuw.webp",
  thoughtlab: "/images/thumbs/thoughtlab.webp",
};

const order = [
  "following-wildfire",
  "engaged",
  "spritexmarvel",
  "filmsecession",
  "theroger",
  "poppr",
  "demorgen",
  "glenncatteeuw",
  "thoughtlab",
];

const projects = {
  "following-wildfire": {
    title: "Following Wildfire",
    description:
      "Following Wildfire showcases an innovative project that uses artificial intelligence (AI) to detect early signs of wildfires by analyzing real-time images shared on social media.",
    info: [
      { title: "Client:", description: "Dentsu creative" },
      { title: "Agency:", description: "Reflektor digital" },
      { title: "Role:", description: "Creative dev" },
      { title: "Year:", description: "2024" },
    ],
  },
  spritexmarvel: {
    title: "Sprite x Marvel",
    description:
      "An immersive, exploratory experience built in partnership with Black Panther: Wakanda Forever, to help creators find inspiration. For more information read the case study.",
    liveUrl: "https://wakanda-forever-master.dogstudio-dev.co/zerolimits",
    info: [
      { title: "Client:", description: "Sprite" },
      { title: "Agency:", description: "Dogstudio / Dept" },
      { title: "Role:", description: "Front-end dev" },
      { title: "Year:", description: "2023" },
    ],
  },
  theroger: {
    title: "The Roger",
    description:
      "Campaign site The Roger for On Running. A performance shoe sportswear brand tailored to both casual and athletic needs.",
    info: [
      { title: "Client:", description: "On Running" },
      { title: "Agency:", description: "North Kingdom" },
      { title: "Role:", description: "Creative dev" },
      { title: "Year:", description: "2021 / 2022" },
    ],
  },
  poppr: {
    title: "Poppr",
    description:
      "Poppr is a digital agency in Ghent, specializing in creating immersive experiences using web, AR and VR technologies.",
    liveUrl: "https://www.poppr.be/",
    info: [
      { title: "Client:", description: "Poppr" },
      { title: "Role:", description: "Creative dev" },
      { title: "Year:", description: "2023" },
    ],
  },
  glenncatteeuw: {
    title: "Glenn Catteeuw",
    description: "Portfolio website for Glenn Catteeuw, an Interactive Art Director & Visual Designer.",
    liveUrl: "https://glenncatteeuw.com",
    info: [
      { title: "Client:", description: "Glenn Catteeuw" },
      { title: "Role:", description: "Full-stack dev" },
      { title: "Year:", description: "2020" },
    ],
  },
  thoughtlab: {
    title: "Thoughtlab",
    description:
      "WebGL visuals for Thoughtlab, a digital agency based in Salt Lake City that focuses on brand strategy, premium web design, and marketing.",
    liveUrl: "https://www.thoughtlab.com/",
    info: [
      { title: "Client:", description: "Thoughtlab" },
      { title: "Role:", description: "Creative dev" },
      { title: "Year:", description: "2021 / 2022" },
    ],
  },
} as const;

type Params = {
  slug: keyof typeof projects;
};

export function generateStaticParams() {
  return Object.keys(projects).map((slug) => ({ slug }));
}

function getNextSlug(slug: string) {
  const index = order.indexOf(slug);
  if (index === -1) return order[0];
  return order[(index + 1) % order.length];
}

export const dynamic = "force-static";

export default async function ProjectFallbackPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const resolvedParams = await params;
  const project = projects[resolvedParams.slug];

  if (!project) {
    notFound();
  }

  const nextSlug = getNextSlug(resolvedParams.slug);
  const nextTitle = projectMeta[nextSlug].title;
  const nextImage = projectMeta[nextSlug].thumb;

  return (
    <SiteShell>
      <ProjectView
        slug={resolvedParams.slug}
        title={project.title}
        description={project.description}
        liveUrl={project.liveUrl}
        info={project.info}
        mediaDesktop={[
          {
            src: projectMeta[resolvedParams.slug].thumb,
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-start-7 lg:col-span-12",
          },
          {
            src: projectMeta[resolvedParams.slug].thumb,
            width: 1600,
            height: 1140,
            className: "col-span-24 lg:col-span-18",
          },
        ]}
        mediaMobile={[
          {
            type: "picture",
            src: projectMeta[resolvedParams.slug].thumb,
            alt: project.title,
            width: 1600,
            height: 1140,
          },
          {
            type: "image",
            src: projectMeta[resolvedParams.slug].thumb,
            alt: "project media",
            width: 1600,
            height: 1140,
          },
        ]}
        next={{
          slug: nextSlug,
          title: nextTitle,
          alt: nextTitle,
          image: {
            src: nextImage,
            width: 1600,
            height: 1140,
            className: "",
          },
        }}
      />
    </SiteShell>
  );
}

const projectMeta: Record<string, { title: string; thumb: string }> = {
  "following-wildfire": { title: "Following Wildfire", thumb: thumbMap["following-wildfire"] },
  engaged: { title: "Engaged", thumb: thumbMap.engaged },
  spritexmarvel: { title: "Sprite x Marvel", thumb: thumbMap.spritexmarvel },
  filmsecession: { title: "Film Secession", thumb: thumbMap.filmsecession },
  theroger: { title: "The Roger", thumb: thumbMap.theroger },
  poppr: { title: "Poppr", thumb: thumbMap.poppr },
  demorgen: { title: "De Morgen", thumb: thumbMap.demorgen },
  glenncatteeuw: { title: "Glenn Catteeuw", thumb: thumbMap.glenncatteeuw },
  thoughtlab: { title: "Thoughtlab", thumb: thumbMap.thoughtlab },
};