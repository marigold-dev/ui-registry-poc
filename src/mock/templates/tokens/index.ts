import nft from "./nft";
import permit from "./permit";

const data = {
  map: { ...nft.map, ...permit.map },
  all: [...nft.all, ...permit.all],
};

export default data;
