export type ProjectMedia = {
  type: "image" | "video";
  src: string;
  alt?: string;
};

export type Project = {
  slug: string;
  title: string;
  year: string;
  role: string;
  cover: string;
  sceneTexture: string;
  accentColor: string;
  description: string;
  media: ProjectMedia[];
};
