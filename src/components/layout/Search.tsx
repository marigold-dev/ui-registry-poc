import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SkeletonCard } from "..";
import { AllPackage, Template } from "../../mock/types";

type props = {
  title?: string;
  description?: string;
  data: (AllPackage | Template)[];
};

const Search = ({ data, title, description }: props) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const list = data.filter((p) =>
    p.name.toLowerCase().includes((router.query?.search as string) ?? "")
  );

  return (
    <>
      <Head>
        <title>Search Package - LIGO Package Registry</title>
        <meta
          name="description"
          content="Search any Ligo package through our registry"
        />
      </Head>
      {list.length === 0 ? (
        <h3 className="w-full text-center text-3xl mt-8 text-slate-600">
          {!!router.query?.search
            ? "No package matching '{router.query?.search}'"
            : "No result found"}
        </h3>
      ) : (
        <>
          {!!title && !!description && (
            <>
              <h2 className="text-3xl font-bold">{title}</h2>
              <p className="text-lg text-slate-700 mt-2">{description}</p>
            </>
          )}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              list.map((pkg, i) => (
                <div className="card mt-0" key={i}>
                  <Link
                    className="has-text-black"
                    href={`/${"downloads" in pkg ? "package" : "template"}/${
                      pkg.name
                    }`}
                  >
                    <header className="card-header">
                      <p className="card-header-title">{pkg.name}</p>
                    </header>
                    <div className="card-content mb-auto">
                      <div className="content">
                        {pkg.description === ""
                          ? "No description"
                          : pkg.description}
                      </div>
                    </div>
                    <div className="card-footer mt-auto">
                      <div className="card-footer-item">
                        <span className="has-text-weight-light">
                          <span className="has-text-weight-light ml-2">
                            v{pkg.version}
                          </span>
                        </span>
                      </div>
                      {"downloads" in pkg && (
                        <div className="card-footer-item">
                          <span className="has-text-weight-bold mr-2">
                            {pkg.downloads}
                          </span>
                          <span className="has-text-weight-light">
                            downloads
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Search;
