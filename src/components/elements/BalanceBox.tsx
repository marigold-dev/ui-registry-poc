import BigNumber from "bignumber.js";
import { fromMutezToTez } from "../../util/tez";

type Props = {
  value: BigNumber;
};

const BalanceBox = ({ value }: Props) => {
  const balance = fromMutezToTez(value);
  return (
    <span className="balance tag is-white is-medium is-family-monospace">
      {balance.toString()}
    </span>
  );
};

export default BalanceBox;
