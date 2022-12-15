import { GetStaticPropsContext } from "next";
import Head from "next/head";
import PackageEnum from "../src/components/elements/PackagesEnum";
import {
  allFeaturedPackages,
  allSortedByDownloadPackages,
} from "../src/mock/data";
import templates from "../src/mock/templates";
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
        <title>LIGO Package Registry</title>
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

        <PackageEnum
          title="Templates"
          subtitle=""
          packages={[
            ...templates.categories.governance.slice(0, 2),
            ...templates.categories.tokens.slice(0, 2),
            ...templates.categories.utilities.slice(0, 2),
          ]}
        />
      </div>
    </>
  );
};

export default Home;
