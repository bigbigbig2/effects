export type ProjectColors = {
  primary: string;
  secondary: string;
  media?: string;
  invert?: string;
};

export type ProjectThumbnail = {
  darkness?: number;
  darknessColor?: string;
  saturation?: number;
  mouseLightness?: number;
};

export type ProjectItem = {
  slug: string;
  title: string;
  texture: string;
  fallbackTexture: string;
  colors: ProjectColors;
  ambient?: number;
  darkenOverview?: number;
  darkenDetail?: number;
  saturation?: number;
  contrast?: number;
  thumbnail?: ProjectThumbnail;
};

export const projects: ProjectItem[] = [
  {
    slug: "following-wildfire",
    title: "Following Wildfire",
    texture: "/content/following-wildfire/images/01.webp",
    fallbackTexture: "/images/thumbs/following-wildfire.webp",
    colors: {
      primary: "#ff924e",
      secondary: "#794e32",
      media: "#2E2E2E",
    },
    ambient: 0.3,
    darkenOverview: 0.2,
    darkenDetail: 0.3,
    contrast: 1.3,
    thumbnail: {
      mouseLightness: 2.5,
    },
  },
  {
    slug: "engaged",
    title: "Engaged",
    texture: "/content/engaged/images/01.webp",
    fallbackTexture: "/images/thumbs/engaged.webp",
    colors: {
      primary: "#a8fffd",
      secondary: "#505566",
      invert: "#41434c",
      media: "#5856B6",
    },
    ambient: 0.4,
  },
  {
    slug: "spritexmarvel",
    title: "Sprite x Marvel",
    texture: "/content/spritexmarvel/images/01.webp",
    fallbackTexture: "/images/thumbs/spritexmarvel.webp",
    colors: {
      primary: "#3fdc77",
      secondary: "#2b3617",
      media: "#222222",
    },
    ambient: 0.4,
  },
  {
    slug: "filmsecession",
    title: "Film Secession",
    texture: "/content/filmsecession/images/01.webp",
    fallbackTexture: "/images/thumbs/filmsecession.webp",
    colors: {
      primary: "#c6b5a0",
      secondary: "#2d2d19",
      media: "#505047",
    },
  },
  {
    slug: "theroger",
    title: "The Roger",
    texture: "/content/theroger/images/01.webp",
    fallbackTexture: "/images/thumbs/the-roger.webp",
    colors: {
      primary: "#fef455",
      secondary: "#1c2d66",
      media: "#6487C4",
    },
    ambient: 1,
    darkenOverview: 0.17,
    darkenDetail: 0.3,
    thumbnail: {
      darkness: 0.1,
      darknessColor: "#2b3760",
      saturation: 1.3,
      mouseLightness: 0.7,
    },
  },
  {
    slug: "poppr",
    title: "Poppr",
    texture: "/content/poppr/images/01.webp",
    fallbackTexture: "/images/thumbs/poppr.webp",
    colors: {
      primary: "#A374FF",
      secondary: "#1b2921",
      media: "#65828D",
    },
    thumbnail: {
      darkness: 0.2,
      darknessColor: "#000000",
      mouseLightness: 0.75,
    },
  },
  {
    slug: "demorgen",
    title: "De Morgen",
    texture: "/content/demorgen/images/01.webp",
    fallbackTexture: "/images/thumbs/de-morgen.webp",
    colors: {
      primary: "#ff362b",
      secondary: "#62100c",
      invert: "#00f7ff",
    },
    ambient: 0.25,
    darkenOverview: 0.2,
    darkenDetail: 0.3,
    saturation: 0.65,
    thumbnail: {
      darkness: 0.15,
      darknessColor: "#000000",
      saturation: 1.45,
      mouseLightness: 0.75,
    },
  },
  {
    slug: "glenncatteeuw",
    title: "Glenn Catteeuw",
    texture: "/content/glenncatteeuw/images/01.webp",
    fallbackTexture: "/images/thumbs/glenn-catteeuw.webp",
    colors: {
      primary: "#c3c3c3",
      secondary: "#1e2b23",
      media: "#2E2E2E",
    },
    ambient: -0.5,
    saturation: 0.35,
    contrast: 1.075,
  },
  {
    slug: "thoughtlab",
    title: "Thoughtlab",
    texture: "/content/thoughtlab/images/01.webp",
    fallbackTexture: "/images/thumbs/thoughtlab.webp",
    colors: {
      primary: "#FFFFFF",
      secondary: "#2b2b2b",
      media: "#181818",
    },
  },
];
