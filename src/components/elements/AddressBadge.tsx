import { useEffect, useState } from "react";
import { GoVerified } from "react-icons/go";
import { TbZoomIn } from "react-icons/tb";
import { VscUnverified } from "react-icons/vsc";
import { hasBadge } from "../../api/AuditorSc/RawStorage";
import { getBadgeFor } from "../../api/AuditorSc/Views";
import { addVerifiedUser } from "../../context/AuditorAction";
import { useAuditor, useAuditorDispatch } from "../../context/AuditorContext";
import { exploreHashUrl } from "../../util/Resolver";

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
  const [errorCopied, setErrorCopied] = useState(false);
  const [badge, setBadge] = useState(false);

  const needLookupEffect = needLookup ? needLookup : false;

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    }

    if (errorCopied) {
      setTimeout(() => {
        setErrorCopied(false);
      }, 1000);
    }
  }, [copied, errorCopied]);

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
      <a
        className="has-text-info mr-2"
        href={exploreHashUrl(value)}
        target="_blank"
        rel="noreferrer"
        title="View in explorer"
      >
        <TbZoomIn />
      </a>

      <a
        href="#"
        className="relative relative group cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          navigator.clipboard
            .writeText(value)
            .then(() => {
              setCopied(true);
            })
            .catch(() => {
              setErrorCopied(true);
            });
        }}
      >
        {representableValue}
        <div
          className={`absolute px-2 py-2 left-1/2 top-full bg-neutral-700 rounded text-white -translate-x-1/2 z-10 group-hover:block translate-y-1 ${
            copied || errorCopied ? "block" : "hidden"
          }`}
        >
          {copied ? "Copied!" : errorCopied ? "Failed to copy" : "Copy"}
        </div>
      </a>

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
