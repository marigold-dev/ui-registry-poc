import { MichelsonMap } from "@taquito/taquito";
import { Address, Index } from "../../types/common";

export type RawStateAsked = { asked: any };
export type RawStateAudited = { audited: any };
export type RawStateDone = { done: Index };
export type RawState = RawStateAsked | RawStateAudited | RawStateDone;

export interface ForgePath {
  readonly account: string;
  readonly repo: string;
  readonly commit: string;
}

export interface GithubPath {
  readonly github: ForgePath;
}

export interface GitlabPath {
  readonly gitlab: ForgePath;
}

export interface Package {
  readonly package: string;
  readonly version: string;
}

export interface PackagePath {
  readonly ligo: Package;
}

export type Forge = GithubPath | GitlabPath | PackagePath;

export type RawEnquiredContent = Forge;

export interface RawMetadata {
  readonly signer: Address;
  readonly created_time: Date;
}

export interface RawDoc<Content> {
  readonly metadata: RawMetadata;
  readonly content: Content;
}

export type RawBadgeStatePending = { pending: any };
export type RawBadgeStateVerified = { verified: any };
export type RawBadgeStateUnverified = { unverified: any };

export type RawBadgeState =
  | RawBadgeStatePending
  | RawBadgeStateUnverified
  | RawBadgeStateVerified;

export interface RawBadge {
  readonly state: RawBadgeState;
  readonly alias: string | null;
}

export const hasBadge = (badge: RawBadge | null): boolean => {
  if (badge !== null && "verified" in badge.state) return true;
  return false;
};

export interface RawAuditEvent {
  readonly state: RawState;
  readonly enquired_doc: RawDoc<RawEnquiredContent>;
}

export type RawResultApprove = {
  approve: any;
};

export type RawResultReject = {
  reject: any;
};

export type RawResult = RawResultApprove | RawResultReject;

export const boolToResult = (x: boolean): RawResult =>
  x === true ? { approve: {} } : { reject: {} };

export const resultToBool = (x: RawResult): boolean =>
  "approve" in x ? true : false;

export interface RawFinalizedContent {
  readonly doc_index: Index;
  readonly finalized_doc_index: Index;
}

export interface RawAuditedContent {
  readonly doc_index: Index;
  readonly result: RawResult;
  readonly comment: string | undefined;
}

export interface RawReviewedContentAudited {
  readonly audited_content: RawAuditedContent;
}

export interface RawReviewedContentFinalized {
  readonly finalized_content: RawFinalizedContent;
}

export type RawReviewedContent =
  | RawReviewedContentAudited
  | RawReviewedContentFinalized;

export type RawReviewedDoc = RawDoc<RawReviewedContent>;

export default interface RawStorage {
  readonly max_reviewed_doc_index: Index;
  readonly max_audit_event_index: Index;
  readonly reviewed_docs: MichelsonMap<Index, RawReviewedDoc>;
  readonly audit_events: MichelsonMap<Index, RawAuditEvent>;
}
