import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SkeletonCard } from "../components";
import { allPackages } from "../mock/data";
import { AllPackage } from "../mock/types";

const Packages = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<AllPackage[]>([]);
  const [filter, setFilter] = useState<string>(() => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop as string),
    });

    // @ts-ignore
    return params.search ?? "";
  });

  useEffect(() => {
    allPackages()
      .then((p) => {
        setPackages(p);
        setIsLoading(false);
      })
      .catch(alert);
  }, []);

  useEffect(() => {
    window.history.replaceState(null, "", `?search=${encodeURI(filter ?? "")}`);
  }, [filter]);

  return (
    <>
      <div>
        <input
          placeholder="Search"
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          className="w-full h-12 border p-4 rounded-full"
          defaultValue={filter}
        />
        <div className="mt-8 flex flex-col space-y-4">
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
                <div className="card" key={i}>
                  <Link className="has-text-black" to={`/packages/${pkg.name}`}>
                    <header className="card-header">
                      <p className="card-header-title">
                        {/* {pkg.isFeatured && (
                  <span className="tag is-info  is-vcentered is-pulled-right mr-4">
                    featured
                  </span>
                )} */}
                        {pkg.name}
                      </p>
                    </header>
                    <div className="card-content">
                      <div className="content">{pkg.description}</div>
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
      </div>
    </>
  );
};

export default Packages;
