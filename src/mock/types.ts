import { Repository } from "../types/common";

export interface Package {
  readonly name: string;
  readonly description: string;
  readonly isFeatured: boolean;
  readonly license: string | null;
  readonly versions: string[];
  readonly website: string | null;
  readonly repository: Repository | null;
  readonly author: string;
  readonly downloads: number;
  readonly keywords: string[];
  readonly readme: string | null;
}
