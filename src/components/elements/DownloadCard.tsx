import { DownloadPackage } from "../../mock/types";
import { Link } from "react-router-dom";

type Props = {
  pkg: DownloadPackage;
};

const PackageCard = ({ pkg }: Props) => {
  return (
    <div className="card">
      <Link className="has-text-black" to={`packages/${pkg.name}`}>
        <header className="card-header">
          <p className="card-header-title">{pkg.name}</p>
        </header>
        <div className="card-content">
          <div className="content">...</div>
        </div>
        <div className="card-footer">
          <div className="card-footer-item">
            <span className="has-text-weight-light">
              <span className="has-text-weight-light ml-2">{pkg.version}</span>
            </span>
          </div>
          <div className="card-footer-item">
            <span className="has-text-weight-bold mr-2">{pkg.downloads}</span>
            <span className="has-text-weight-light">downloads</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PackageCard;
