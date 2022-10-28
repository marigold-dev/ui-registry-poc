import AuditorState, {
  booted,
  linkWallet,
  notAsked,
  walletNotAsked,
} from "./AuditorState";
import AUditorAction, {
  ACTION_GET_TEZOS_BLOCK_HASH,
  ACTION_LINK_BEACON_WALLET,
  ACTION_UNLINK_BEACON_WALLET,
} from "./AuditorAction";
import { RPC_URL } from "../config";
import { TezosToolkit } from "@taquito/taquito";
import {
  Context,
  createContext,
  ReactNode,
  useContext,
  useReducer,
} from "react";
import { AuditorDispatcher } from "../types/common";

export const toolkit = new TezosToolkit(RPC_URL);

const AuditorContextReducer = (
  state: AuditorState,
  action: AUditorAction
): AuditorState => {
  switch (action.type) {
    case ACTION_GET_TEZOS_BLOCK_HASH: {
      const { blockHash, blockLevel, contract, storage, auditEvents } = action;
      return booted(
        state,
        toolkit,
        blockHash,
        blockLevel,
        contract,
        storage,
        auditEvents
      );
    }
    case ACTION_LINK_BEACON_WALLET: {
      const { wallet, balance, address } = action;
      if (state.type === "BOOTED") {
        if (state.wallet.type === "NOT_ASKED") {
          return { ...state, wallet: linkWallet(wallet, address, balance) };
        }
      }
      return state;
    }
    case ACTION_UNLINK_BEACON_WALLET: {
      if (state.type === "BOOTED") {
        return { ...state, wallet: walletNotAsked() };
      }
      return state;
    }
  }
};

export const AuditorContext: Context<any> = createContext(null);
export const AuditorDispatchContext: Context<any> = createContext(null);

type Props = {
  children?: ReactNode;
};

const AuditorProvider = ({ children }: Props) => {
  const [auditor, dispatch] = useReducer(AuditorContextReducer, notAsked());
  return (
    <AuditorContext.Provider value={auditor}>
      <AuditorDispatchContext.Provider value={dispatch}>
        {children}
      </AuditorDispatchContext.Provider>
    </AuditorContext.Provider>
  );
};

export const useAuditor = (): AuditorState => useContext(AuditorContext);
export const useAuditorDispatch = (): AuditorDispatcher =>
  useContext(AuditorDispatchContext);

export default AuditorProvider;
