import { MichelCodecPacker } from "@taquito/taquito";
import { connectWallet, createWallet } from "../api/BeaconWallet";
import { getBalance } from "../api/Tezos";
import { linkBeaconWallet } from "../context/AuditorAction";
import AuditorState from "../context/AuditorState";
import { AuditorDispatcher } from "../types/common";

const handle =
  (dispatch: AuditorDispatcher, state: AuditorState) =>
  async (): Promise<void> => {
    if (state.type !== "BOOTED" || state.wallet.type !== "NOT_ASKED") return;

    try {
      const toolkit = state.toolkit;
      const wallet = await createWallet();
      toolkit.setWalletProvider(wallet);
      toolkit.setPackerProvider(new MichelCodecPacker());
      const walletAddress = await connectWallet(wallet);
      const balance = await getBalance(toolkit, walletAddress);

      dispatch(linkBeaconWallet(wallet, walletAddress, balance));
    } catch (err: any) {
      console.error(err);
    }
  };

export default handle;
