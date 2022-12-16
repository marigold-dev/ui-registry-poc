import { useEffect, useRef, useState } from "react";
import RawStorage from "../../api/AuditorSc/RawStorage";
import {
  getContract,
  getStorage,
  getTezosCurrentBlockHash,
  getTezosCurrentBlockLevel,
} from "../../api/Tezos";
import { AUDITOR_SC_ADDRESS, BLOCK_FREQUENCY } from "../../config";
import { getTezosBlockHash } from "../../context/AuditorAction";
import {
  toolkit as tezosToolkit,
  useAuditor,
  useAuditorDispatch,
} from "../../context/AuditorContext";
import useInterval from "../../hooks/useInterval";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import AddressBadge from "./AddressBadge";
import WalletSection from "./WalletSection";

const ChainHeightButton = () => {
  const state = useAuditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAuditorDispatch();
  const [isActive, setActive] = useState(false);
  const [clock, setClock] = useState(0);
  const [lastBlockHash, setLastBlockHash] = useState<string | null>(null);
  useOnClickOutside(containerRef, () => setActive(false));

  useInterval(() => setClock(clock + 1), BLOCK_FREQUENCY);

  useEffect(() => {
    let subscription = true;

    if (state.type === "NOT_ASKED" || state.type === "BOOTED") {
      const fetchBlock = async () => {
        if (subscription) {
          try {
            const toolkit = tezosToolkit;
            const currentBlockHash = await getTezosCurrentBlockHash(toolkit);
            const currentBlockLevel = await getTezosCurrentBlockLevel(toolkit);
            const contract = await getContract(toolkit, AUDITOR_SC_ADDRESS);
            const storage = await getStorage<RawStorage>(contract);

            if (lastBlockHash !== currentBlockHash) {
              setLastBlockHash(currentBlockHash);
              dispatch(
                getTezosBlockHash(
                  currentBlockHash,
                  currentBlockLevel,
                  contract,
                  storage
                )
              );
            }
          } catch (e) {
            console.log(e);
          }
        }
      };
      fetchBlock();
    }
    return () => {
      subscription = false;
    };
  }, [lastBlockHash, clock, state, dispatch]);

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
          ref={containerRef}
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
