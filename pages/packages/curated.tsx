import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SkeletonCard } from "../../src/components";
import { allFeaturedPackages } from "../../src/mock/data";
import { AllPackage } from "../../src/mock/types";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return allFeaturedPackages()
    .then((packages) => ({
      props: { packages },
      revalidate: 60,
    }))
    .catch(() => ({
      props: { packages: [] },
      revalidate: 60,
    }));
}

const Curated = ({ packages }: { packages: AllPackage[] }) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>(
    () => (router.query?.search as string) ?? ""
  );

  useEffect(() => {
    if (!router.isReady) return;

    setFilter((router.query?.search as string) ?? "");
  }, [router.query]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    window.history.replaceState(null, "", `?search=${encodeURI(filter ?? "")}`);
  }, [filter]);

  return (
    <>
      <Head>
        <title>Ligo Package Registry - Search Package</title>
        <meta
          name="description"
          content="Search any Ligo package through our registry"
        />
      </Head>
      <div>
        <input
          placeholder="Search"
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          className="w-full h-12 border p-4 rounded-full"
          defaultValue={filter}
        />
        <div className="mt-8 grid grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            packages
              .filter((p) => p.name.toLowerCase().includes(filter))
              .map((pkg, i) => (
                <Link
                  className="block rounded bg-slate-100 p-4"
                  href={`/packages/${pkg.name}`}
                  key={i}
                >
                  <header className="flex items-center justify-between">
                    <p className="text-xl">{pkg.name}</p>
                    <p>
                      Downloads <span>{pkg.downloads}</span>
                    </p>
                  </header>

                  <p className="mt-2 text-slate-500">
                    {pkg.description === ""
                      ? "No description"
                      : pkg.description}
                  </p>
                </Link>
              ))
          )}
        </div>
      </div>
    </>
  );
};

export default Curated;
