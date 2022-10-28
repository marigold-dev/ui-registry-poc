import { WalletContract } from "@taquito/taquito";
import { enquireAudit } from "../api/AuditorSc/Endpoint";
import { Forge } from "../api/AuditorSc/RawStorage";

const handle =
  (target: Forge, contract: WalletContract) => async (): Promise<void> => {
    try {
      await enquireAudit(contract, target);
    } catch (err: any) {
      console.error(err);
    }
  };

export default handle;
