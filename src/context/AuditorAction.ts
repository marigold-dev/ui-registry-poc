import { BeaconWallet } from "@taquito/beacon-wallet";
import { WalletContract } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import RawStorage from "../api/AuditorSc/RawStorage";
import { LookupView } from "../api/AuditorSc/Views";

export type GET_TEZOS_BLOCK_HASH = "GET_TEZOS_BLOCK_HASH";
export type LINK_BEACON_WALLET = "LINK_BEAUCON_WALLET";
export type UNLINK_BEACON_WALLET = "UNLINK_BEACON_WALLET";

export const ACTION_GET_TEZOS_BLOCK_HASH: GET_TEZOS_BLOCK_HASH =
  "GET_TEZOS_BLOCK_HASH";

export const ACTION_LINK_BEACON_WALLET: LINK_BEACON_WALLET =
  "LINK_BEAUCON_WALLET";

export const ACTION_UNLINK_BEACON_WALLET: UNLINK_BEACON_WALLET =
  "UNLINK_BEACON_WALLET";

export type GetTezosBlockHash = {
  type: GET_TEZOS_BLOCK_HASH;
  blockHash: string;
  blockLevel: number;
  contract: WalletContract;
  storage: RawStorage;
  auditEvents: LookupView[];
};

export type LinkBeaconWallet = {
  type: LINK_BEACON_WALLET;
  wallet: BeaconWallet;
  address: string;
  balance: BigNumber;
};

export type UnlinkBeaconWallet = {
  type: UNLINK_BEACON_WALLET;
};

export const getTezosBlockHash = (
  blockHash: string,
  blockLevel: number,
  contract: WalletContract,
  storage: RawStorage,
  auditEvents: LookupView[]
): GetTezosBlockHash => ({
  type: ACTION_GET_TEZOS_BLOCK_HASH,
  blockHash,
  blockLevel,
  contract,
  storage,
  auditEvents,
});

export const linkBeaconWallet = (
  wallet: BeaconWallet,
  address: string,
  balance: BigNumber
): LinkBeaconWallet => ({
  type: ACTION_LINK_BEACON_WALLET,
  wallet,
  address,
  balance,
});

export const unlinkBeaconWallet = (): UnlinkBeaconWallet => ({
  type: ACTION_UNLINK_BEACON_WALLET,
});

type Action = GetTezosBlockHash | LinkBeaconWallet | UnlinkBeaconWallet;

export default Action;
