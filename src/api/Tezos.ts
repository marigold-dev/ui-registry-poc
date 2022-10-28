import { TezosToolkit, WalletContract } from "@taquito/taquito";

export const getTezosCurrentBlockHash = async (
  toolkit: TezosToolkit
): Promise<string> => {
  const blockHash = await toolkit.rpc.getBlockHash();
  return blockHash;
};

export const getTezosCurrentBlockLevel = async (
  toolkit: TezosToolkit
): Promise<number> => {
  const blockLevel = await toolkit.rpc.getBlockHeader();
  return blockLevel.level;
};

export const getBalance = async (toolkit: TezosToolkit, address: string) =>
  await toolkit.tz.getBalance(address);

export const getContract = async (
  toolkit: TezosToolkit,
  address: string
): Promise<WalletContract> => {
  const contract = await toolkit.contract.at(address);
  const walletContract = await toolkit.wallet.at(contract.address);
  return walletContract;
};

export const getStorage = async <S>(contract: WalletContract): Promise<S> => {
  const storage: S = await contract.storage();
  return storage;
};
