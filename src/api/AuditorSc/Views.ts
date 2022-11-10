import { MichelsonMap, WalletContract } from "@taquito/taquito";
import { AUDITOR_SC_ADDRESS } from "../../config";
import { Address, Index, Nat } from "../../types/common";
import { Requested } from "./ProceededStorage";
import { RawAuditEvent, RawBadge, RawReviewedDoc } from "./RawStorage";

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

export const forOnePackage = async (
  contract: WalletContract,
  packageName: string,
  version: string
): Promise<Requested[]> => {
  const views = await lookup(contract, packageName, version);
  return views
    .map((view: LookupView) => {
      const requested: Requested = {
        index: view.id,
        owner: view.audit_event.enquired_doc.metadata.signer,
        datetime: new Date(view.audit_event.enquired_doc.metadata.created_time),
        target: view.audit_event.enquired_doc.content,
        state: view.audit_event.state,
        reviews: Array.from(view.reviewed_docs.values()),
      };
      console.log(requested);
      return requested;
    })
    .sort(
      (a: Requested, b: Requested) =>
        a.datetime.getTime() - b.datetime.getTime()
    );
};

export const getBadgeFor = async (
  contract: WalletContract,
  address: Address
): Promise<RawBadge | null> => {
  const views = await contract.contractViews;
  const getBadge = views.get_badge(address);
  return getBadge.executeView({ viewCaller: AUDITOR_SC_ADDRESS });
};
