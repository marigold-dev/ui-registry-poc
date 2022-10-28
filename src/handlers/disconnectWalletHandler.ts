import { AuditorDispatcher } from "../types/common";
import AuditorState from "../context/AuditorState";
import { disconnectWallet } from "../api/BeaconWallet";
import { unlinkBeaconWallet } from "../context/AuditorAction";

const handle =
  (dispatch: AuditorDispatcher, state: AuditorState) =>
  async (): Promise<void> => {
    if (state.type === "BOOTED") {
      if (state.wallet.type === "WALLET_LINKED") {
        try {
          await disconnectWallet(state.wallet.wallet);
          dispatch(unlinkBeaconWallet());
        } catch (err: any) {
          console.error(err);
        }
      }
    }
  };

export default handle;
