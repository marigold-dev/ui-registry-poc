import dao from "./dao";
import multisig from "./multisig";

export default {
  map: {
    ...multisig.map,
    ...dao.map,
  },
  all: [...multisig.all, ...dao.all],
};
