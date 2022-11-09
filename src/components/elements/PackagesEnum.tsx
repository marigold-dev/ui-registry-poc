import { DownloadPackage, Package } from "../../mock/types";
import PackageCard from "./PackageCard";
import DownloadCard from "./DownloadCard";

type Props = {
  title: string;
  subtitle: string;
  packages: (Package | DownloadPackage)[] | null | undefined;
};

const PackageEnum = ({ title, subtitle, packages }: Props) => {
  return (
    <section className="hero">
      <div className="hero-body">
        <p className="title">{title}</p>
        <p className="subtitle">{subtitle}</p>
        <div className="columns is-desktop is-multiline">
          {packages !== null && packages !== undefined ? (
            packages.map((aPackage, i: number) =>
              "dist-tags" in aPackage ? (
                <div key={i} className="column is-4">
                  <PackageCard pkg={aPackage} />
                </div>
              ) : (
                <div key={i} className="column is-4">
                  <DownloadCard pkg={aPackage} />
                </div>
              )
            )
          ) : (
            <></>
          )}
        </div>
      </div>
    </section>
  );
};

export default PackageEnum;
