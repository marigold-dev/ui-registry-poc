import Link from "next/link";
import { AllPackage } from "../../mock/types";

type Props = {
  pkg: AllPackage;
};

const PackageCard = ({ pkg }: Props) => {
  return (
    <div className="card rounded">
      <Link
        className="has-text-black h-full flex flex-col"
        href={`package/${pkg.name}`}
      >
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
        <div className="card-content mb-auto">
          <div className="content">
            {!pkg.description ? (
              <span className="text-neutral-500">No description</span>
            ) : (
              pkg.description
            )}
          </div>
        </div>
        <div className="card-footer mt-auto">
          <div className="card-footer-item">
            <span className="has-text-weight-light">
              <span className="has-text-weight-light ml-2">v{pkg.version}</span>
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
