import dao from "./dao";
import multisig from "./multisig";

const data = {
  map: {
    ...multisig.map,
    ...dao.map,
  },
  all: [...multisig.all, ...dao.all],
};

export default data;
