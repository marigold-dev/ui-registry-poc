import { useEffect, useState } from "react";
import PackageEnum from "../components/elements/PackagesEnum";
import { allFeaturedPackages, allSortedByDownloadPackages } from "../mock/data";
import { Package } from "../mock/types";

const Home = () => {
  const [packageList, setPackageList] = useState<Package[] | null>(null);
  const [featuredPackageList, setFeaturedPackageList] = useState<
    Package[] | null
  >(null);

  useEffect(() => {
    let subscription = true;
    const getPackagesList = async () => {
      if (subscription) {
        const packages = await allSortedByDownloadPackages();
        const featuredPackages = await allFeaturedPackages();
        setPackageList(packages);
        setFeaturedPackageList(featuredPackages);
      }
    };
    getPackagesList();
    return () => {
      subscription = false;
    };
  }, []);

  return (
    <>
      <PackageEnum
        title="Featured Packages"
        subtitle="Packages curated by developers"
        packages={featuredPackageList}
      />

      <PackageEnum
        title="Most downloaded"
        subtitle="Last week"
        packages={packageList?.slice(0, 6)}
      />
    </>
  );
};

export default Home;
