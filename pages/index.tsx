import { GetStaticPropsContext } from "next";
import Head from "next/head";
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
      revalidate: 60,
    }))
    .catch(() => ({
      props: {
        allSortedDl: [],
        allFeatured: [],
      },
      revalidate: 60,
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
      <Head>
        <title>Ligo Package Registry</title>
        <meta
          name="description"
          content="Search for a package or template to use in your project"
        />
      </Head>
      <div className="space-y-6">
        <PackageEnum
          title="Packages"
          subtitle="Most downloaded"
          packages={allSortedDl.slice(0, 6)}
        />
        <h2 className="text-2xl font-bold mt-6">Templates</h2>
        <div className="gap-4 mt-4 text-xl text-neutral-500">
          Templates are baking in Ligo's oven... Coming Soon!
        </div>
      </div>
    </>
  );
};

export default Home;
