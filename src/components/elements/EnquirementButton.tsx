import { Requested } from "../../api/AuditorSc/ProceededStorage";
import { useAuditor } from "../../context/AuditorContext";
import enquireAuditHandler from "../../handlers/enquireAuditHandler";

type Props = {
  packageName: string;
  version: string;
  requested: Requested[] | null;
};

const EnquirementButton = ({ packageName, version, requested }: Props) => {
  const state = useAuditor();
  if (state.type === "BOOTED") {
    if (
      state.contract.type === "CONTRACT_LINKED" &&
      state.wallet.type === "WALLET_LINKED"
    ) {
      const contract = state.contract.contract;
      const address = state.wallet.address;
      if (requested === null) return <></>;
      if (requested.find((r: Requested) => r.owner === address) !== undefined)
        return <></>;
      return (
        <button
          onClick={enquireAuditHandler(
            {
              ligo: { package: packageName, version },
            },
            contract
          )}
          className="button is-primary"
        >
          Enquire an audit
        </button>
      );
    }
  }
  return <></>;
};

export default EnquirementButton;
