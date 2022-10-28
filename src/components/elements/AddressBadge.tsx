import { CopyToClipboard } from "react-copy-to-clipboard";
import { TbClipboard, TbClipboardCheck, TbZoomIn } from "react-icons/tb";
import { useEffect, useState } from "react";
import { exploreHashUrl } from "../../util/Resolver";

type Props = {
  value: string;
  needNormalization?: boolean;
};

const normalize = (value: string): string => {
  const len = value.length;
  const offset = len - 4;
  const first = value.substring(0, 8);
  const last = value.substring(offset, len);
  return first + ".." + last;
};

const AddressBadge = ({ value, needNormalization }: Props) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [value]);

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
    </span>
  );
};

export default AddressBadge;
