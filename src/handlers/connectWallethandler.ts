import { AuditorDispatcher } from "../types/common";
import AuditorState from "../context/AuditorState";
import { connectWallet, createWallet } from "../api/BeaconWallet";
import { MichelCodecPacker } from "@taquito/taquito";
import { getBalance } from "../api/Tezos";
import { linkBeaconWallet } from "../context/AuditorAction";
import { connect as ipfsConnect } from "../api/IPFS";

const handle =
  (dispatch: AuditorDispatcher, state: AuditorState) =>
  async (): Promise<void> => {
    if (state.type === "BOOTED") {
      if (state.wallet.type === "NOT_ASKED") {
        try {
          const toolkit = state.toolkit;
          const wallet = await createWallet();
          toolkit.setWalletProvider(wallet);
          toolkit.setPackerProvider(new MichelCodecPacker());
          const walletAddress = await connectWallet(wallet);
          const balance = await getBalance(toolkit, walletAddress);
          const ipfs = await ipfsConnect();
          if (ipfs.status === "OK") {
            dispatch(
              linkBeaconWallet(wallet, walletAddress, balance, ipfs.client)
            );
          } else {
            const message = ipfs.error;
            console.error(message);
          }
        } catch (err: any) {
          console.error(err);
        }
      }
    }
  };

export default handle;
