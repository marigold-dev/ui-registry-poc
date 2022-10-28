import BigNumber from "bignumber.js";
import { Dispatch } from "react";
import AuditorAction from "../context/AuditorAction";

export type AuditorDispatcher = Dispatch<AuditorAction>;

export type Forge = "github" | "gitlab";

export interface Repository {
  readonly forge: Forge;
  readonly account: string;
  readonly repository: string;
}

export type Address = string;
export type Nat = BigNumber;
export type Index = Nat;
export type Indexes = Index[];
