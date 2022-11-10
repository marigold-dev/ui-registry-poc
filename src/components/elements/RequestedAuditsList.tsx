import { Requested } from "../../api/AuditorSc/ProceededStorage";
import EnquiredAudit from "./EnquiredAudit";

type Props = {
  requests: Requested[] | null;
};

const RequestedAuditsList = ({ requests }: Props) => {
  if (requests === null)
    return <div className="notification is-warning mt-6">fetching audit</div>;
  return (
    <>
      <h2 className="title is-5 mt-6">Enquired audits</h2>
      <ul>
        {requests.map((r: Requested, i: number) => (
          <li key={i}>
            <EnquiredAudit requested={r} />
          </li>
        ))}
      </ul>
    </>
  );
};

export default RequestedAuditsList;
