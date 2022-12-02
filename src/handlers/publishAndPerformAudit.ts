import { BeaconWallet } from "@taquito/beacon-wallet";
import { WalletContract } from "@taquito/taquito";
import { performAudit } from "../api/AuditorSc/Endpoint";
import { client } from "../api/IPFS";
import { FileOrNullDispatcher, Index } from "../types/common";

const handle = async (
  wallet: BeaconWallet,
  contract: WalletContract,
  docIndex: Index,
  result: boolean,
  file: File,
  setContent: FileOrNullDispatcher
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const { cid } = await fetch("https://ipfs-proxy.gcp.marigold.dev/add", {
      method: "POST",
      body: formData,
    }).then((res) => res.json());

    console.log("HERE:", cid);
    await performAudit(contract, docIndex, result, cid);
    setContent(null);
  } catch (err: any) {
    console.log(err);
  }
};

export default handle;
