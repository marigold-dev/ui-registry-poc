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
          href={"/packages"}
          title="Packages"
          subtitle="Most downloaded"
          packages={allSortedDl.slice(0, 6)}
        />

        <PackageEnum
          title="Templates"
          href="/templates"
          subtitle="Featured contracts"
          packages={[
            templates.map["NFT-Factory-Cameligo"],
            templates.map["Multisig-Jsligo"],
            templates.map["Permit-Cameligo"],
            templates.map["DAO-Jsligo"],
            templates.map["Randomness-Cameligo"],
            templates.map["Shifumi-Jsligo"],
          ]}
        />
      </div>
    </>
  );
};

export default Home;
