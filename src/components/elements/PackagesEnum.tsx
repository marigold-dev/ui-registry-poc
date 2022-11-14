import { AllPackage } from "../../mock/types";
import PackageCard from "./PackageCard";
import SkeletonCard from "./SkeletonCard";

type Props = {
  title: string;
  subtitle: string;
  packages: AllPackage[] | null | undefined;
};

const PackageEnum = ({ title, subtitle, packages }: Props) => {
  return (
    <section className="hero">
      <div className="hero-body">
        <p className="title">{title}</p>
        <p className="subtitle">{subtitle}</p>
        <div className="grid-cols-3 grid gap-4">
          {!!packages ? (
            packages.map((aPackage, i: number) => (
              <PackageCard key={i} pkg={aPackage} />
            ))
          ) : (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default PackageEnum;
