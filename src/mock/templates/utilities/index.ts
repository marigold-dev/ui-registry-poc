import advisor from "./advisor";
import randomness from "./randomness";
import shifumi from "./shifumi";

const data = {
  map: {
    ...randomness.map,
    ...shifumi.map,
    ...advisor.map,
  },
  all: [...randomness.all, ...shifumi.all, ...advisor.all],
};

export default data;
