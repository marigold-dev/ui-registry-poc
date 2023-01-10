import { ReactNode, useEffect, useState } from "react";
import Icon, { IconName } from "./Icon";

type props = {
  children: ReactNode;
  value: string;
  className?: string;
};

const Copy = ({ value, children, className }: props) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    setTimeout(() => setCopied(false), 2000);
  }, [copied]);

  return (
    <button
      className={`flex space-x-2 items-center ${className}`}
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard.writeText(value).then(() => {
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
