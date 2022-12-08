import { Requested } from "../../api/AuditorSc/ProceededStorage";
import EnquiredAudit from "./EnquiredAudit";

type Props = {
  requests: Requested[] | null;
};

const RequestedAuditsList = ({ requests }: Props) => {
  if (requests === null)
    return <div className="notification is-warning mt-2">fetching audit</div>;
  return (
    <ul className="mt-2">
      {requests.map((r: Requested, i: number) => (
        <li key={i}>
          <EnquiredAudit requested={r} />
        </li>
      ))}
    </ul>
  );
};

export default RequestedAuditsList;
