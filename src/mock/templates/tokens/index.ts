import nft from "./nft";
import permit from "./permit";

export default {
  map: { ...nft.map, ...permit.map },
  all: [...nft.all, ...permit.all],
};
