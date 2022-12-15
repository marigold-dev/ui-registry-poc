import { AllPackage, Template } from "../../mock/types";
import PackageCard from "./PackageCard";
import SkeletonCard from "./SkeletonCard";

type Props = {
  title: string;
  subtitle: string;
  packages: AllPackage[] | Template[] | null | undefined;
};

const PackageEnum = ({ title, subtitle, packages }: Props) => {
  return (
    <section>
      <h2 className="text-2xl font-bold">{title}</h2>
      <h3 className="text-xl">{subtitle}</h3>
      <div className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 grid gap-4 mt-2">
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
    </section>
  );
};

export default PackageEnum;
