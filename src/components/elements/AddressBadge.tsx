import { CopyToClipboard } from "react-copy-to-clipboard";
import { TbClipboard, TbClipboardCheck, TbZoomIn } from "react-icons/tb";
import { GoVerified } from "react-icons/go";
import { VscUnverified } from "react-icons/vsc";
import { useEffect, useState } from "react";
import { exploreHashUrl } from "../../util/Resolver";
import { useAuditor, useAuditorDispatch } from "../../context/AuditorContext";
import { getBadgeFor } from "../../api/AuditorSc/Views";
import { hasBadge } from "../../api/AuditorSc/RawStorage";
import { addVerifiedUser } from "../../context/AuditorAction";

type Props = {
  value: string;
  needNormalization?: boolean;
  needLookup?: boolean;
};

const normalize = (value: string): string => {
  const len = value.length;
  const offset = len - 4;
  const first = value.substring(0, 8);
  const last = value.substring(offset, len);
  return first + ".." + last;
};

const AddressBadge = ({ value, needNormalization, needLookup }: Props) => {
  const state = useAuditor();
  const dispatch = useAuditorDispatch();
  const [copied, setCopied] = useState(false);
  const [badge, setBadge] = useState(false);

  const needLookupEffect = needLookup ? needLookup : false;

  useEffect(() => {
    setCopied(false);
  }, [value]);

  useEffect(() => {
    let subscription = true;
    if (needLookupEffect && state.type === "BOOTED" && subscription) {
      const contract = state.contract;
      const isVerified = state.verifiedAddresses.get(value);
      if (isVerified === undefined && contract.type === "CONTRACT_LINKED") {
        const callback = async () => {
          console.log("request badge for", value);
          const badge = await getBadgeFor(contract.contract, value);
          const result = hasBadge(badge);
          dispatch(addVerifiedUser(value, result));
        };
        callback();
      } else {
        // Lol unification 2
        console.log("already stored", isVerified);
        setBadge(isVerified ? isVerified : false);
      }
    }
    return () => {
      subscription = false;
    };
  }, [state, dispatch, needLookupEffect, setBadge, value]);

  const representableValue = needNormalization ? normalize(value) : value;
  return (
    <span className="tag is-medium is-white is-family-monospace">
      <a className="has-text-info mr-2" href={exploreHashUrl(value)}>
        <TbZoomIn />
      </a>
      <span>{representableValue}</span>

      <CopyToClipboard
        onCopy={() => setCopied(true)}
        options={{ message: "Whoa!" }}
        text={value}
      >
        {copied ? (
          <TbClipboardCheck className="ml-2 has-text-info" />
        ) : (
          <TbClipboard className="ml-2 has-text-info" />
        )}
      </CopyToClipboard>
      {needLookup === undefined ? (
        <></>
      ) : badge ? (
        <GoVerified />
      ) : (
        <VscUnverified />
      )}
    </span>
  );
};

export default AddressBadge;
