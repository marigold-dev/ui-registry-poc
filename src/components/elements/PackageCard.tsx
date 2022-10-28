import { Package } from "../../mock/types";
import { Link } from "react-router-dom";

type Props = {
  pkg: Package;
};

const PackageCard = ({ pkg }: Props) => {
  return (
    <div className="card">
      <Link className="has-text-black" to={`package/${pkg.name}`}>
        <header className="card-header">
          <p className="card-header-title">
            {pkg.isFeatured ? (
              <span className="tag is-info  is-vcentered is-pulled-right mr-4">
                featured
              </span>
            ) : (
              <></>
            )}
            {pkg.name}
          </p>
        </header>
        <div className="card-content">
          <div className="content">{pkg.description}</div>
        </div>
        <div className="card-footer">
          <div className="card-footer-item">
            <span className="has-text-weight-light">
              <span className="has-text-weight-light ml-2">
                {" "}
                {pkg.versions.slice(-1)}
              </span>
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
