import { AUDITOR_SC_ADDRESS, EXPLORER_BASE_URI } from "../config";
import { Repository } from "../mock/types";

export const exploreHashUrl = (hash: string): string =>
  EXPLORER_BASE_URI + "/" + hash;

export const exploreAuditorSc = exploreHashUrl(AUDITOR_SC_ADDRESS);

const urlRegex = /http[s]?:\/\/.+\/(.+\/.+)/;

export const resolveRepositoryUrl = (
  repository: Repository
): { url: string; name: string } => {
  return { url: repository.url, name: "Repository" };
};
