import { TransactionWalletOperation, WalletContract } from "@taquito/taquito";
import { Index } from "../../types/common";
import { Forge, RawAuditedContent, boolToResult } from "./RawStorage";

export const enquireAudit = async (
  contract: WalletContract,
  target: Forge
): Promise<TransactionWalletOperation> => {
  const entrypoint = contract.methodsObject.enquire_audit;
  const operation = await entrypoint(target).send();
  await operation.confirmation();
  return operation;
};

export const performAudit = async (
  contract: WalletContract,
  docIndex: Index,
  result: boolean,
  comment: string | null
) => {
  const parsedContent = comment === null ? undefined : comment.trim();
  const input: RawAuditedContent = {
    doc_index: docIndex,
    result: boolToResult(result),
    comment:
      parsedContent === undefined || parsedContent === ""
        ? undefined
        : parsedContent,
  };
  const entrypoint = contract.methodsObject.perform_audit;
  const operation = await entrypoint(input).send();
  await operation.confirmation();
  return operation;
};
