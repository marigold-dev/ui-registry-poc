import { AUDITOR_SC_ADDRESS, EXPLORER_BASE_URI } from "../config";
import { Repository } from "../types/common";

export const exploreHashUrl = (hash: string): string =>
  EXPLORER_BASE_URI + "/" + hash;

export const exploreAuditorSc = exploreHashUrl(AUDITOR_SC_ADDRESS);

export const resolveRepositoryUrl = (
  repository: Repository
): { url: string; name: string } => {
  const suffix = `${repository.account}/${repository.repository}`;
  const url = `https://${repository.forge}.com/${suffix}`;
  const name = `${repository.forge}/${suffix}`;
  return { url, name };
};
