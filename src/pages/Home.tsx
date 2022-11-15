import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../components";
import PackageEnum from "../components/elements/PackagesEnum";
import { allFeaturedPackages, allSortedByDownloadPackages } from "../mock/data";
import { AllPackage } from "../mock/types";

const Home = () => {
  const [packageList, setPackageList] = useState<AllPackage[] | null>(null);
  const [featuredPackageList, setFeaturedPackageList] = useState<
    AllPackage[] | null
  >(null);

  useEffect(() => {
    let subscription = true;
    const getPackagesList = async () => {
      if (subscription) {
        allSortedByDownloadPackages().then(setPackageList);
        allFeaturedPackages().then(setFeaturedPackageList);
      }
    };
    getPackagesList();
    return () => {
      subscription = false;
    };
  }, []);

  return (
    <PageContainer>
      <div className="space-y-6">
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
      </div>
    </PageContainer>
  );
};

export default Home;
