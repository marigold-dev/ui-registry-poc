import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SkeletonCard } from "../../src/components";
import { allPackages } from "../../src/mock/data";
import { AllPackage } from "../../src/mock/types";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return allPackages()
    .then((packages) => ({
      props: { packages },
      revalidate: 60,
    }))
    .catch(() => ({
      props: { packages: [] },
      revalidate: 60,
    }));
}

const Packages = ({ packages }: { packages: AllPackage[] }) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const list = packages.filter((p) =>
    p.name.toLowerCase().includes((router.query?.search as string) ?? "")
  );
  return (
    <>
      <Head>
        <title>Ligo Package Registry - Search Package</title>
        <meta
          name="description"
          content="Search any Ligo package through our registry"
        />
      </Head>
      {list.length === 0 ? (
        <h3 className="w-full text-center text-3xl mt-8 text-slate-600">
          No package matching '{router.query?.search}'
        </h3>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 space-y-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            list.map((pkg, i) => (
              <div className="card" key={i}>
                <Link className="has-text-black" href={`/packages/${pkg.name}`}>
                  <header className="card-header">
                    <p className="card-header-title">{pkg.name}</p>
                  </header>
                  <div className="card-content">
                    <div className="content">
                      {pkg.description === ""
                        ? "No description"
                        : pkg.description}
                    </div>
                  </div>
                  <div className="card-footer">
                    <div className="card-footer-item">
                      <span className="has-text-weight-light">
                        <span className="has-text-weight-light ml-2">
                          {pkg.version}
                        </span>
                      </span>
                    </div>
                    <div className="card-footer-item">
                      <span className="has-text-weight-bold mr-2">
                        {pkg.downloads}
                      </span>
                      <span className="has-text-weight-light">downloads</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default Packages;
