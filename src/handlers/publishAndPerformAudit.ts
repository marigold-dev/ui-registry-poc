import { BeaconWallet } from "@taquito/beacon-wallet";
import { WalletContract } from "@taquito/taquito";
import { performAudit } from "../api/AuditorSc/Endpoint";
import { client } from "../api/IPFS";
import { FileOrNullDispatcher, Index } from "../types/common";

const handle = async (
  wallet: BeaconWallet,
  contract: WalletContract,
  ipfsClient: client,
  docIndex: Index,
  result: boolean,
  file: File,
  setContent: FileOrNullDispatcher
): Promise<void> => {
  try {
    const artifact = await ipfsClient.add(file, {
      progress: (progress) => console.log(`publish ${progress}`),
    });
    const content = artifact.cid.toString();
    console.log("file hash", content);
    await performAudit(contract, docIndex, result, content);
    setContent(null);
  } catch (err: any) {
    console.log(err);
  }
};

export default handle;
