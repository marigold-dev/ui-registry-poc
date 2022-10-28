import { MichelsonMap, WalletContract } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import { AUDITOR_SC_ADDRESS } from "../../config";
import { Index, Nat } from "../../types/common";
import { Requested } from "./ProceededStorage";
import RawStorage, { RawAuditEvent, RawReviewedDoc } from "./RawStorage";

export interface LookupView {
  readonly audit_event: RawAuditEvent;
  id: Index;
  reviewed_docs: MichelsonMap<Index, RawReviewedDoc>;
}

export const full = async (
  contract: WalletContract,
  size: Nat,
  offset: Index
): Promise<LookupView[]> => {
  const views = await contract.contractViews;
  const audit = views.full_audit_events([size, offset]);
  return audit.executeView({ viewCaller: AUDITOR_SC_ADDRESS });
};

export const lookup = async (
  contract: WalletContract,
  packageName: string,
  version: string
): Promise<LookupView[]> => {
  const packageDesc = { package: packageName, version };
  const entrypoint = { ligo: packageDesc };
  const views = await contract.contractViews;
  const lookup = views.lookup(entrypoint);
  return lookup.executeView({ viewCaller: AUDITOR_SC_ADDRESS });
};

export const forOne = async (
  contract: WalletContract,
  rawStorage: RawStorage,
  packageName: string,
  version: string
): Promise<Requested[]> => {
  const { max_audit_event_index, audit_events } = rawStorage;
  const requestedList = [];
  for (
    let index = BigNumber(0);
    max_audit_event_index.gt(index);
    index = index.plus(BigNumber(1))
  ) {
    const mapKey = index.plus(BigNumber(1));

    try {
      const entry = await audit_events.get(mapKey);
      if (entry !== undefined && "ligo" in entry.enquired_doc.content) {
        const p = entry.enquired_doc.content.ligo;
        if (p.package === packageName && p.version === version) {
          const state = entry.state;

          if ("asked" in state) {
            const requestedEntry: Requested = {
              owner: entry.enquired_doc.metadata,
              target: entry.enquired_doc.content,
              index: mapKey,
            };
            requestedList.push(requestedEntry);
          } else if ("audited" in state) {
            const x = await lookup(contract, packageName, version);
            console.log(x);
          }
        }
      }
    } catch (_: any) {
      console.log("ignored entry");
    }
  }
  return requestedList;
};
