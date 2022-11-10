import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer, Header } from "../components";
import PackageEnum from "../components/elements/PackagesEnum";
import { allFeaturedPackages, allSortedByDownloadPackages } from "../mock/data";
import { AllPackage, DownloadPackage, Package } from "../mock/types";

const Home = () => {
  const navigate = useNavigate();
  const [packageList, setPackageList] = useState<AllPackage[]>([]);
  const [featuredPackageList, setFeaturedPackageList] = useState<AllPackage[]>(
    []
  );

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
    <>
      <Header />
      <main role="main">
        <section className="section main-content container">
          <div className="px-12">
            <input
              placeholder="Search"
              className="w-full h-12 border p-4 rounded-full"
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;

                navigate(
                  `/packages?search=${(e.target as HTMLInputElement).value}`
                );
              }}
            />
          </div>

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
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;
