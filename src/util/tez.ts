import BigNumber from "bignumber.js";

export const fromMutezToTez = (balance: BigNumber): BigNumber => {
  const oneTez = BigNumber(1_000_000);
  return balance.dividedBy(oneTez);
};
