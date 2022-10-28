import { Address, Index } from "../../types/common";
import { Forge } from "./RawStorage";

export type Requested = {
  target: Forge;
  owner: Address;
  index: Index;
};
