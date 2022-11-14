import { AllPackage } from "../../mock/types";
import { Link } from "react-router-dom";

type Props = {
  pkg: AllPackage;
};

const PackageCard = ({ pkg }: Props) => {
  return (
    <div className="card rounded">
      <Link className="has-text-black" to={`packages/${pkg.name}`}>
        <header className="card-header">
          <p className="card-header-title">
            {pkg.isFeatured && (
              <span className="tag is-info  is-vcentered is-pulled-right mr-4">
                featured
              </span>
            )}
            {pkg.name}
          </p>
        </header>
        <div className="card-content">
          <div className="content">
            {!pkg.description ? (
              <span className="text-neutral-500">No description</span>
            ) : (
              pkg.description
            )}
          </div>
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
