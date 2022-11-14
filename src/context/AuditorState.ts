import { BeaconWallet } from "@taquito/beacon-wallet";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import RawStorage from "../api/AuditorSc/RawStorage";
import { client as ipfsClient } from "../api/IPFS";
import { Address } from "../types/common";

export type NotAsked = {
  type: "NOT_ASKED";
};

export type WalletLinked = {
  type: "WALLET_LINKED";
  wallet: BeaconWallet;
  balance: BigNumber;
  address: string;
  ipfsClient: ipfsClient;
};

export type WalletState = NotAsked | WalletLinked;

export type ContractLinked = {
  type: "CONTRACT_LINKED";
  contract: WalletContract;
  storage: RawStorage;
};

export type ContractState = NotAsked | ContractLinked;

export type Booted = {
  type: "BOOTED";
  toolkit: TezosToolkit;
  currentBlockHash: string;
  currentBlockLevel: number;
  wallet: WalletState;
  contract: ContractLinked;
  verifiedAddresses: Map<Address, boolean>;
};

type State = NotAsked | Booted;

export const notAsked = (): State => ({
  type: "NOT_ASKED",
});

export const walletNotAsked = (): WalletState => ({
  type: "NOT_ASKED",
});

export const booted = (
  state: State,
  toolkit: TezosToolkit,
  currentBlockHash: string,
  currentBlockLevel: number,
  contract: WalletContract,
  storage: RawStorage
): State => {
  switch (state.type) {
    case "NOT_ASKED": {
      return {
        type: "BOOTED",
        toolkit,
        currentBlockHash,
        currentBlockLevel,
        contract: { type: "CONTRACT_LINKED", contract, storage },
        wallet: walletNotAsked(),
        verifiedAddresses: new Map<Address, boolean>([]),
      };
    }
    default:
      return { ...state, toolkit, currentBlockHash, currentBlockLevel };
  }
};

export const linkWallet = (
  wallet: BeaconWallet,
  address: string,
  balance: BigNumber,
  ipfsClient: ipfsClient
): WalletState => ({
  type: "WALLET_LINKED",
  wallet,
  balance,
  address,
  ipfsClient,
});

export default State;
