import { Address, Index } from "../../types/common";
import { Forge, RawReviewedDoc, RawState } from "./RawStorage";

export type Requested = {
  index: Index;
  target: Forge;
  owner: Address;
  datetime: Date;
  state: RawState;
  reviews: RawReviewedDoc[];
};
