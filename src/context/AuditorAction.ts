import { BeaconWallet } from "@taquito/beacon-wallet";
import { WalletContract } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import RawStorage from "../api/AuditorSc/RawStorage";
import { client as ipfsClient } from "../api/IPFS";
import { Address } from "../types/common";

export type GET_TEZOS_BLOCK_HASH = "GET_TEZOS_BLOCK_HASH";
export type LINK_BEACON_WALLET = "LINK_BEAUCON_WALLET";
export type UNLINK_BEACON_WALLET = "UNLINK_BEACON_WALLET";
export type ADD_VERIFIED_USER = "ADD_VERIFIED_USER";

export const ACTION_GET_TEZOS_BLOCK_HASH: GET_TEZOS_BLOCK_HASH =
  "GET_TEZOS_BLOCK_HASH";

export const ACTION_LINK_BEACON_WALLET: LINK_BEACON_WALLET =
  "LINK_BEAUCON_WALLET";

export const ACTION_UNLINK_BEACON_WALLET: UNLINK_BEACON_WALLET =
  "UNLINK_BEACON_WALLET";

export const ACTION_ADD_VERIFIED_USER: ADD_VERIFIED_USER = "ADD_VERIFIED_USER";

export type GetTezosBlockHash = {
  type: GET_TEZOS_BLOCK_HASH;
  blockHash: string;
  blockLevel: number;
  contract: WalletContract;
  storage: RawStorage;
};

export type LinkBeaconWallet = {
  type: LINK_BEACON_WALLET;
  wallet: BeaconWallet;
  address: string;
  balance: BigNumber;
  ipfsClient: ipfsClient | undefined;
};

export type UnlinkBeaconWallet = {
  type: UNLINK_BEACON_WALLET;
};

export type AddVerifiedUser = {
  type: ADD_VERIFIED_USER;
  address: string;
  isVerified: boolean;
};

export const getTezosBlockHash = (
  blockHash: string,
  blockLevel: number,
  contract: WalletContract,
  storage: RawStorage
): GetTezosBlockHash => ({
  type: ACTION_GET_TEZOS_BLOCK_HASH,
  blockHash,
  blockLevel,
  contract,
  storage,
});

export const linkBeaconWallet = (
  wallet: BeaconWallet,
  address: string,
  balance: BigNumber,
  ipfsClient?: ipfsClient
): LinkBeaconWallet => ({
  type: ACTION_LINK_BEACON_WALLET,
  wallet,
  address,
  balance,
  ipfsClient,
});

export const unlinkBeaconWallet = (): UnlinkBeaconWallet => ({
  type: ACTION_UNLINK_BEACON_WALLET,
});

export const addVerifiedUser = (
  address: Address,
  isVerified: boolean
): AddVerifiedUser => ({
  type: ACTION_ADD_VERIFIED_USER,
  address,
  isVerified,
});

type Action =
  | GetTezosBlockHash
  | LinkBeaconWallet
  | UnlinkBeaconWallet
  | AddVerifiedUser;

export default Action;
