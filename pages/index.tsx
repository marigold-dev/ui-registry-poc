import { GetStaticPropsContext } from "next";
import PackageEnum from "../src/components/elements/PackagesEnum";
import {
  allFeaturedPackages,
  allSortedByDownloadPackages,
} from "../src/mock/data";
import { AllPackage } from "../src/mock/types";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return Promise.all([allSortedByDownloadPackages(), allFeaturedPackages()])
    .then(([allSortedDl, allFeatured]) => ({
      props: {
        allSortedDl,
        allFeatured,
      },
    }))
    .catch(() => ({
      props: {
        allSortedDl: [],
        allFeatured: [],
      },
    }));
}

const Home = ({
  allSortedDl,
  allFeatured,
}: {
  allSortedDl: AllPackage[];
  allFeatured: AllPackage[];
}) => {
  return (
    <>
      <div className="space-y-6">
        <PackageEnum
          title="Featured Packages"
          subtitle="Packages curated by developers"
          packages={allFeatured}
        />

        <PackageEnum
          title="Most downloaded"
          subtitle="Last week"
          packages={allSortedDl.slice(0, 6)}
        />
      </div>
    </>
  );
};

export default Home;
