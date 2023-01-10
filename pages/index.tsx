import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { getTemplates } from "../server/templates";
import PackageEnum from "../src/components/elements/PackagesEnum";
import {
  allFeaturedPackages,
  allSortedByDownloadPackages,
} from "../src/mock/data";
import { AllPackage, Template } from "../src/mock/types";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return Promise.all([
    allSortedByDownloadPackages(),
    allFeaturedPackages(),
    getTemplates(),
  ])
    .then(([allSortedDl, allFeatured, templates]) => ({
      props: {
        allSortedDl,
        allFeatured,
        templates,
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
  templates,
}: {
  allSortedDl: AllPackage[];
  allFeatured: AllPackage[];
  templates: Template[];
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
            templates.find((t) => t.name === "NFT-Factory-Cameligo")!,
            templates.find((t) => t.name === "Multisig-Jsligo")!,
            templates.find((t) => t.name === "Permit-Cameligo")!,
            templates.find((t) => t.name === "DAO-Jsligo")!,
            templates.find((t) => t.name === "Randomness-Cameligo")!,
            templates.find((t) => t.name === "Shifumi-Jsligo")!,
          ]}
        />
      </div>
    </>
  );
};

export default Home;
