import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { Icon, IconName } from "../src/components";
import Ligo from "../src/components/images/Ligo";
import {
  allFeaturedPackages,
  allPackages,
  allSortedByDownloadPackages,
} from "../src/mock/data";
import templates from "../src/mock/templates";
import { AllPackage, Template } from "../src/mock/types";
import { viewbox } from "../src/types/size";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return Promise.all([
    allSortedByDownloadPackages(),
    allFeaturedPackages(),
    allPackages(),
  ])
    .then(([allSortedDl, allFeatured, allPackages]) => ({
      props: {
        allSortedDl,
        allFeatured,
        allPackages: allPackages.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        ),
      },
      revalidate: 60,
    }))
    .catch(() => ({
      props: {
        allSortedDl: [],
        allFeatured: [],
        allPackages: [],
      },
      revalidate: 60,
    }));
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${isActive ? "text-ligo" : ""} hover:text-ligo`;

type packageProps = {
  data: AllPackage | Template;
};

const Package = ({ data }: packageProps) => (
  <Link
    href={`/package/${data.name}`}
    className="flex items-center justify-between w-full p-4 bg-slate-100 rounded text-left hover:bg-slate-200"
  >
    <div>
      <p>{data.name}</p>

      <p className="mt-1 text-slate-500">
        {data.description === "" ? "No description" : data.description}
      </p>
    </div>
    <Icon name={IconName.ChevronDown} className="-rotate-90 w-6 h-6" />
  </Link>
);

const Home = ({
  allSortedDl,
  allFeatured,
  allPackages,
}: {
  allSortedDl: AllPackage[];
  allFeatured: AllPackage[];
  allPackages: AllPackage[];
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
      <nav
        className={`w-full w-full fixed left-0 right-0 top-0 h-20 bg-slate-50 z-50 flex justify-center overflow-hidden md:overflow-visible`}
        role="navigation"
        aria-label="main navigation"
      >
        <div className="max-w-7xl px-4 md:px-0 flex items-center justify-between flex-wrap md:flex-no-wrap w-full h-full">
          <Link href="/" className="mt-4 md:mt-0 md:-translate-y-2">
            <h1 className="flex items-center">
              <Ligo
                width={40}
                height={40}
                viewBox={viewbox(0, 0, 60, 60)}
                fill="#0E74FF"
              />
              <div className="uppercase ml-2 text-ligo text-xl">
                <span className="font-bold">Ligo</span>
                <span className="font-medium">Registry</span>
              </div>
              <button className="ml-1 px-3 py-1 bg-ligo text-white rounded-full hover:text-white hover:bg-ligo-dark">
                Beta
              </button>
            </h1>
          </Link>

          <div className="flex flex-col w-full space-y-2 md:space-y-0 py-4 md:py-0 md:w-auto md:flex-row items-center justify-center md:justify-start space-x-4">
            <Link
              className={navLinkClass({ isActive: false })}
              href="https://ligolang.org/docs/intro/installation"
              target="_blank"
              rel="noreferrer"
            >
              Browse templates
            </Link>
            <Link
              className={navLinkClass({ isActive: false })}
              href="/packages"
            >
              Browse packages
            </Link>
          </div>
        </div>
      </nav>
      <section className="pt-20 w-full bg-slate-50 py-12 flex flex-col items-center space-y-4">
        <h1 className="text-3xl text-ligo font-bold">Ligo package registry</h1>
        <div className="w-full md:w-80">
          <input
            placeholder="Search"
            className="w-full h-12 border p-4 rounded-full"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;

              const target = e.target as HTMLInputElement;

              // router.push(`/packages?search=${target.value}`);

              target.value = "";
              target.blur();
            }}
          />
        </div>
      </section>

      <main className="w-full md:max-w-7xl ml-auto mr-auto mt-8 mb-40">
        <div className="w-full flex justify-center space-x-8">
          <a
            className="font-bold text-center w-80 px-4 py-2 text-white bg-ligo hover:bg-ligo-dark hover:text-white rounded-full"
            href="https://ligolang.org/docs/intro/installation"
            target="_blank"
            rel="noreferrer"
          >
            Install Ligo
          </a>
          <a
            className="font-bold text-center w-80 px-4 py-2 text-white bg-ligo hover:bg-ligo-dark hover:text-white rounded-full"
            href="https://ligolang.org/docs/advanced/package-management"
            target="_blank"
            rel="noreferrer"
          >
            Ligo package manager
          </a>
        </div>
        <p className="text-slate-500 text-center mt-8">
          Lorem Ipsum has been the industry's standard dummy text ever since the
          1500s, when an unknown printer took a galley of type and scrambled it
          to make a type specimen book. It has survived not only five centuries,
          but also the leap into electronic typesetting, remaining essentially
          unchanged. It was popularised in the 1960s with the release of
          Letraset sheets containing Lorem Ipsum passages, and more recently
          with desktop publishing software like Aldus PageMaker including
          versions of Lorem Ipsum
        </p>
        <div className="mt-8">
          <h2 className="text-2xl text-ligo font-bold">
            Templates
            <Link
              href="/packages"
              className="ml-2 text-ligo underline text-sm hover:text-ligo-dark"
            >
              see all
            </Link>
          </h2>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-center mb-2 text-lg font-medium">Token</h3>
              {templates.categories.token.slice(0, 3).map((t, i) => (
                <Package key={i} data={t} />
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-center mb-2 text-lg font-medium">
                Governance
              </h3>
              {templates.categories.governance.slice(0, 3).map((t, i) => (
                <Package key={i} data={t} />
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-center mb-2 text-lg font-medium">
                Utilities
              </h3>
              {templates.categories.utilities.slice(0, 3).map((t, i) => (
                <Package key={i} data={t} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl text-ligo font-bold">
            Packages
            <Link
              href="/packages"
              className="ml-2 text-ligo underline text-sm hover:text-ligo-dark"
            >
              see all
            </Link>
          </h2>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-center mb-2 text-lg font-medium">
                Curated by developers
              </h3>
              {allFeatured.slice(0, 6).map((t, i) => (
                <Package key={i} data={t} />
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-center mb-2 text-lg font-medium">
                New packages
              </h3>
              {allPackages.slice(0, 6).map((t, i) => (
                <Package key={i} data={t} />
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-center mb-2 text-lg font-medium">
                Most downloaded
              </h3>
              {allSortedDl.slice(0, 6).map((t, i) => (
                <Package key={i} data={t} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
