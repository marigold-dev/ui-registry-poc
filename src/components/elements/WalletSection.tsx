import { useAuditor, useAuditorDispatch } from "../../context/AuditorContext";
import connectWalletHandler from "../../handlers/connectWallethandler";
import disconnectWalletHandler from "../../handlers/disconnectWalletHandler";
import AddressBadge from "./AddressBadge";
import BalanceBox from "./BalanceBox";

const WalletSection = () => {
  const dispatch = useAuditorDispatch();
  const state = useAuditor();

  if (state.type === "BOOTED") {
    if (state.wallet.type === "NOT_ASKED") {
      return (
        <div className="dropdown-item has-text-centered">
          <button
            onClick={connectWalletHandler(dispatch, state)}
            className="button is-primary"
          >
            Connect Wallet
          </button>
        </div>
      );
    }
    return (
      <>
        <div className="dropdown-item has-text-centered">Connected as</div>
        <hr className="dropdown-divider"></hr>
        <div className="dropdown-item has-text-centered">
          <AddressBadge needNormalization value={state.wallet.address} />
          <BalanceBox value={state.wallet.balance} />
        </div>
        <hr className="dropdown-divider"></hr>
        <div className="dropdown-item has-text-centered">
          <button
            onClick={disconnectWalletHandler(dispatch, state)}
            className="button is-danger"
          >
            Disconnect Wallet
          </button>
        </div>
      </>
    );
  }
  return <></>;
};

export default WalletSection;
