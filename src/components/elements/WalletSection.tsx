import { BeaconWallet } from "@taquito/beacon-wallet";
import { MichelCodecPacker } from "@taquito/taquito";
import { useEffect, useState } from "react";
import { createWallet } from "../../api/BeaconWallet";
import { getBalance } from "../../api/Tezos";
import { NETWORK_TYPE, RPC_URL } from "../../config";
import { linkBeaconWallet } from "../../context/AuditorAction";
import { useAuditor, useAuditorDispatch } from "../../context/AuditorContext";
import connectWalletHandler from "../../handlers/connectWallethandler";
import disconnectWalletHandler from "../../handlers/disconnectWalletHandler";
import AddressBadge from "./AddressBadge";
import BalanceBox from "./BalanceBox";

const WalletSection = () => {
  const dispatch = useAuditorDispatch();
  const state = useAuditor();
  const [wallet, setWallet] = useState<BeaconWallet | undefined>();

  useEffect(() => {
    if (state.type === "NOT_ASKED") return;

    const connect = async () => {
      try {
        const wallet = await createWallet();
        state.toolkit.setWalletProvider(wallet);
        state.toolkit.setPackerProvider(new MichelCodecPacker());
        const activeAccount = await wallet.client.getActiveAccount();

        if (!!activeAccount) {
          const address = await wallet.getPKH();
          const balance = await getBalance(state.toolkit, address);

          dispatch(linkBeaconWallet(wallet, address, balance));
        }

        setWallet(wallet);
      } catch (e) {
        console.error(e);
      }
    };

    connect();
  }, [state.type]);

  if (state.type === "BOOTED" && state.wallet.type === "NOT_ASKED") {
    return (
      <div className="dropdown-item has-text-centered">
        <button
          onClick={async () => {
            if (!wallet) return;

            try {
              await wallet.client.requestPermissions({
                network: { type: NETWORK_TYPE, rpcUrl: RPC_URL },
                // scopes: [PermissionScope.SIGN],
              });

              const address = await wallet.getPKH();
              const balance = await getBalance(state.toolkit, address);
              dispatch(linkBeaconWallet(wallet, address, balance));
            } catch (e) {
              console.error(e);
            }
          }}
          className="button is-primary"
        >
          Connect Wallet
        </button>
      </div>
    );
  } else if (state.type === "BOOTED" && state.wallet.type !== "NOT_ASKED") {
    return (
      <>
        <div className="dropdown-item has-text-centered">Connected as</div>
        <hr className="dropdown-divider"></hr>
        <div className="dropdown-item has-text-centered">
          <AddressBadge needNormalization value={state.wallet.address} />
          <BalanceBox value={state.wallet.balance} />
        </div>
        <hr className="dropdown-divider"></hr>
        <div className="dropdown-item has-text-centered">
          <button
            onClick={disconnectWalletHandler(dispatch, state)}
            className="button is-danger"
          >
            Disconnect Wallet
          </button>
        </div>
      </>
    );
  } else return <></>;
};

export default WalletSection;
