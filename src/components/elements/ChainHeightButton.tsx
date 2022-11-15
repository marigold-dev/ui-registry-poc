import { useState } from "react";
import { useAuditor } from "../../context/AuditorContext";
import AddressBadge from "./AddressBadge";
import WalletSection from "./WalletSection";

const ChainHeightButton = () => {
  const state = useAuditor();
  const [isActive, setActive] = useState(false);

  switch (state.type) {
    case "NOT_ASKED": {
      return (
        <div className="dropdown">
          <div className="dropdown-trigger">
            <button
              className="button"
              aria-haspopup="true"
              aria-controls="wallet-button"
            >
              <div className="animate-pulse h-full w-32 bg-neutral-300 rounded"></div>
            </button>
          </div>
        </div>
      );
    }
    default: {
      return (
        <div
          className={
            "dropdown is-right is-left-mobile is-desktop" +
            (isActive ? " is-active" : "")
          }
        >
          <div className="dropdown-trigger">
            <button
              className="button"
              aria-haspopup="true"
              aria-controls="wallet-button"
              onClick={() => {
                setActive(!isActive);
              }}
            >
              <span className="has-text-weight-light mr-2">Tezos Height</span>
              {state.currentBlockLevel} +
            </button>
          </div>
          <div className="dropdown-menu" id="wallet-button">
            <div className="dropdown-content">
              <div className="dropdown-item">
                <AddressBadge
                  needNormalization
                  value={state.currentBlockHash}
                />
              </div>
              <hr className="dropdown-divider"></hr>
              <WalletSection />
            </div>
          </div>
        </div>
      );
    }
  }
};

export default ChainHeightButton;
