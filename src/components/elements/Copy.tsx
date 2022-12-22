import { useEffect, useState } from "react";
import Icon, { IconName } from "./Icon";

type props = {
  children: string;
};

const Copy = ({ children }: props) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    setTimeout(() => setCopied(false), 2000);
  }, [copied]);

  return (
    <button
      className="flex space-x-2 items-center"
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard.writeText(children).then(() => {
          setCopied(true);
        });
      }}
    >
      <span>{children}</span>
      <Icon
        name={copied ? IconName.Check : IconName.Copy}
        className="w-4 h-4 -translate-y-px"
      />
    </button>
  );
};

export default Copy;
