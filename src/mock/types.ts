export type Repository = {
  type: "git";
  url: string;
  directory: null;
};

export type version = {
  _id: string;
  author?: { name: string };
  contributors: [];
  description: string;
  dist: { integrity: string; shasum: string; tarball: string };
  name: string;
  repository: string | Repository;
  website?: string;
  scripts: string[];
  version: string;
};

export type AllPackage = {
  name: string;
  author?: {
    name: string;
    email: string;
    url: string;
    avatar: string;
  };
  main: string;
  type: "library";
  storage_fn: null;
  storage_arg: null;
  repository: Repository | string;
  version: string;
  description: string;
  scripts: [];
  _id: string;
  dist: {
    integrity: string;
    shasum: string;
    tarball: string;
  };
  contributors: [];
  time: string;
  users: {};
  downloads: number;
  isFeatured?: boolean;
};

export type DownloadPackage = {
  author?: { name: string; email: string };
  downloads: number;
  name: string;
  version: string;
};

export type Package = {
  _attachments: { [k: string]: { shasum: string } };
  _distfiles: { [k: string]: { sha: string; url: string } };
  _id: string;
  _rev: string;
  _uplinks: { npmjs: { etag: string; fetched: number } };
  admin: string;
  license?: string;
  "dist-tags": { latest: string };
  name: string;
  readme: string;
  time: { created: string; modified: string; [k: string]: string };
  users: {};
  versions: { [k: string]: version };
  downloads: number;
  isFeatured?: boolean;
};

export type Template = {
  name: string;
  category: string;
  description: string;
  readme: string;
  mainFile: string;
};
