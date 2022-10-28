import { PermissionScope } from "@airgap/beacon-sdk";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { APP_NAME, NETWORK_TYPE, RPC_URL } from "../config";

export const createWallet = async () => {
  return new BeaconWallet({
    name: APP_NAME,
    preferredNetwork: NETWORK_TYPE,
  });
};

export const connectWallet = async (wallet: BeaconWallet) => {
  const activeAccount = await wallet.client.getActiveAccount();
  if (activeAccount === undefined) {
    await wallet.requestPermissions({
      network: { type: NETWORK_TYPE, rpcUrl: RPC_URL },
      scopes: [PermissionScope.SIGN],
    });
  }
  const address = await wallet.getPKH();
  return address;
};

export const disconnectWallet = async (wallet: BeaconWallet) => {
  await wallet.client.removeAllAccounts();
  await wallet.clearActiveAccount();
  await wallet.client.destroy();
  await wallet.disconnect();
};
