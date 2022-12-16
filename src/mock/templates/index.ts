import governance from "./governance";
import tokens from "./tokens";
import utilities from "./utilities";

const data = {
  map: {
    ...tokens.map,
    ...governance.map,
    ...utilities.map,
  },
  categories: {
    tokens: tokens.all,
    governance: governance.all,
    utilities: utilities.all,
    all: [...tokens.all, ...governance.all, ...utilities.all],
  },
};

export default data;
