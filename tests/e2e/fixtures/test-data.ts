import path from "node:path";

const datasetRoot = path.resolve(process.cwd(), "tests", "e2e", "fixtures", "datasets");

export const datasets = {
  patreon: path.join(datasetRoot, "patreon_good.csv"),
  youtube: path.join(datasetRoot, "youtube_good.csv"),
  instagram: path.join(datasetRoot, "instagram_good.csv"),
  unsupported: path.join(datasetRoot, "unsupported_bad_file.txt"),
};

export const sourceNames = {
  patreon: "Patreon",
  youtube: "YouTube",
  instagram: "Instagram",
};

export const platformIds = {
  patreon: "patreon",
  youtube: "youtube",
  instagram: "instagram",
} as const;
