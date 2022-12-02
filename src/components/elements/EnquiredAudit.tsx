import { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { MdCheckBox, MdError } from "react-icons/md";
import { Requested } from "../../api/AuditorSc/ProceededStorage";
import { RawReviewedDoc, resultToBool } from "../../api/AuditorSc/RawStorage";
import { useAuditor } from "../../context/AuditorContext";
import publishAndPerformAudit from "../../handlers/publishAndPerformAudit";
import AddressBadge from "./AddressBadge";

type Props = {
  requested: Requested;
};

const ToolBox = ({ requested }: Props) => {
  const state = useAuditor();
  const [content, setContent] = useState<File | null>(null);

  if (state.type === "BOOTED") {
    const wallet = state.wallet;
    const contract = state.contract;
    if (
      wallet.type === "WALLET_LINKED" &&
      contract.type === "CONTRACT_LINKED"
    ) {
      const userAddress = wallet.address;
      const isAlreadyReviewed =
        requested.reviews.find(
          (doc: RawReviewedDoc) => doc.metadata.signer === userAddress
        ) !== undefined;
      if (userAddress !== requested.owner && !isAlreadyReviewed) {
        return (
          <>
            <div className="mt-2">
              <input
                id="artifact"
                className="select-file"
                type="file"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files !== null && files.length === 1) {
                    const file = files.item(0);
                    setContent(file);
                  } else {
                    setContent(null);
                  }
                }}
              />
              {content === null ? (
                <></>
              ) : (
                <>
                  <div className="mt-2">
                    <button
                      onClick={async () => {
                        publishAndPerformAudit(
                          wallet.wallet,
                          contract.contract,
                          requested.index,
                          true,
                          content,
                          setContent
                        );
                      }}
                      className="button is-primary is-small"
                    >
                      V
                    </button>
                    <button
                      onClick={async () => {
                        publishAndPerformAudit(
                          wallet.wallet,
                          contract.contract,
                          requested.index,
                          false,
                          content,
                          setContent
                        );
                      }}
                      className="button is-danger is-small"
                    >
                      X
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        );
      } else {
        return <></>;
      }
    }
  }
  return <></>;
};

const ReviewableAudit = ({ requested }: Props) => {
  if (requested.reviews.length < 1) {
    return <></>;
  }

  return (
    <div className="mt-2">
      <hr />
      <ul>
        {requested.reviews.map((review: RawReviewedDoc, i: number) => {
          const content = review.content;
          const isAuditedContent = "audited_content" in content;
          const icon = isAuditedContent ? (
            resultToBool(content.audited_content.result) ? (
              <MdCheckBox />
            ) : (
              <MdError />
            )
          ) : (
            <></>
          );

          const artifact = isAuditedContent ? <button>ipfs</button> : <></>;
          const url = isAuditedContent
            ? content.audited_content.comment
              ? content.audited_content.comment
              : ""
            : "";

          return (
            <li key={i}>
              {icon}
              <AddressBadge
                value={review.metadata.signer}
                needNormalization
                needLookup
              />
              <CopyToClipboard options={{ message: "Whoa!" }} text={url}>
                {artifact}
              </CopyToClipboard>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const EnquiredAudit = ({ requested }: Props) => {
  return (
    <div className="box mb-2">
      <AddressBadge value={requested.owner} needNormalization needLookup />
      <ToolBox requested={requested} />
      <ReviewableAudit requested={requested} />
    </div>
  );
};

export default EnquiredAudit;
