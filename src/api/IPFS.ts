import { create, IPFSHTTPClient } from "ipfs-http-client";
import { IPFS_GATEWAY_MULTIADDR } from "../config";

export type client = IPFSHTTPClient;

export type ConnectedStatusOK = {
  status: "OK";
  client: client;
};

export type ConnectedStatusKO = {
  status: "KO";
  error: string;
};

export type ConnectedStatus = ConnectedStatusOK | ConnectedStatusKO;

export const connect = async (): Promise<ConnectedStatus> => {
  try {
    const client = create({ url: IPFS_GATEWAY_MULTIADDR });
    console.log("connecting to IPFS");
    const isConnected = await client.isOnline();
    if (isConnected) {
      console.log("connected");
      return { status: "OK", client };
    }
    return { status: "KO", error: "unknown error" };
  } catch (err: any) {
    console.log(err);
    return { status: "KO", error: err.message };
  }
};
