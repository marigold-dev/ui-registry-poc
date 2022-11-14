import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getOnePackage } from "../mock/data";
import { Package } from "../mock/types";
import { Repository } from "../mock/types";
import { resolveRepositoryUrl } from "../util/Resolver";
import { useAuditor } from "../context/AuditorContext";
import { forOnePackage } from "../api/AuditorSc/Views";
import EnquirementButton from "../components/elements/EnquirementButton";
import { Requested } from "../api/AuditorSc/ProceededStorage";
import RequestedAuditsList from "../components/elements/RequestedAuditsList";
import { PageContainer } from "../components";

type FullPackage = {
  package: Package;
};

const ViewPackage = () => {
  const params = useParams();
  const navigate = useNavigate();

  const [fullPkg, setFullPkg] = useState<FullPackage | null>(null);

  const state = useAuditor();
  const [requestedAudits, setRequestedAudits] = useState<Requested[] | null>(
    null
  );

  useEffect(() => {
    if (!params["*"]) return navigate("/");

    getOnePackage(params["*"]!).then((pkg) => {
      if (!pkg) return;
      setFullPkg({ package: pkg });
    });
  }, []);

  useEffect(() => {
    let subscription = true;
    console.log("test");

    if (state.type === "BOOTED" && fullPkg !== null) {
      const contract = state.contract;
      if (contract.type === "CONTRACT_LINKED") {
        if (subscription) {
          const makeLookup = async () => {
            const packageName = fullPkg.package.name;
            const version =
              fullPkg.package.versions[fullPkg.package["dist-tags"].latest];
            const requested = await forOnePackage(
              contract.contract,
              packageName,
              version.version
            );
            setRequestedAudits(requested);
          };
          makeLookup();
        }
      }
    }
    return () => {
      subscription = false;
    };
  }, [fullPkg, state]);

  const pkg = fullPkg?.package.versions[fullPkg.package["dist-tags"].latest];

  const links = [pkg?.website, pkg?.repository].filter(
    (e: string | Repository | null | undefined) => !!e
  ) as (string | Repository)[];

  const renderedLinks = links.map((e: string | Repository, i: number) => {
    const { url, name } =
      typeof e === "string"
        ? { url: e, name: "Website" }
        : resolveRepositoryUrl(e);

    return (
      <li key={i}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="hover:text-ligo"
        >
          {name}
        </a>
      </li>
    );
  });

  return (
    <PageContainer>
      {(() => {
        if (!pkg)
          return (
            <section>
              <div>
                <h1 className="title">
                  <div className="animate-pulse h-4 w-64 bg-neutral-300 rounded"></div>
                </h1>
                <h2 className="subtitle">
                  <div className="animate-pulse w-32 h-4 bg-neutral-300 rounded"></div>
                </h2>
                <div className="columns">
                  <div className="column is-8">
                    <section className="mb-6 package-meta flex space-x-4 animate-pulse">
                      <div className="h-4 w-12 bg-neutral-300 rounded"></div>
                      <div className="h-4 w-12 bg-neutral-300 rounded"></div>
                    </section>

                    <section className="mt-4">
                      <div className="animate-pulse w-24 h-4 bg-neutral-300 rounded"></div>
                      <div className="animate-pulse h-24 bg-neutral-300 rounded mt-4"></div>
                    </section>

                    <section className="mt-6 space-y-2 animate-pulse">
                      <div className="h-4 bg-neutral-300 rounded"></div>
                      <div className="h-4 bg-neutral-300 rounded"></div>
                      <div className="h-4 bg-neutral-300 rounded"></div>
                      <div className="h-4 bg-neutral-300 rounded"></div>
                      <div className="h-4 bg-neutral-300 rounded"></div>
                    </section>
                  </div>

                  <div className="column is-4 is-medium pl-5 animate-pulse space-y-2">
                    <div className="h-24 bg-neutral-300 rounded"></div>
                    <div className="h-24 bg-neutral-300 rounded"></div>
                  </div>
                </div>
              </div>
            </section>
          );
        else
          return (
            <section>
              <div>
                <h1 className="text-3xl font-bold">
                  {pkg.name}
                  <span className="ml-2 text-xl font-light">
                    {"v" + pkg.version}
                  </span>
                </h1>
                <h2 className="mt-1 text-xl">{pkg.description}</h2>
                <div className="mt-4 flex">
                  <div className="w-4/6">
                    <section className="mb-6 package-meta space-x-4">
                      {!!fullPkg.package.license && (
                        <span className="tag is-medium">
                          {fullPkg.package.license}
                        </span>
                      )}
                      <span className="text-lg p-2 bg-neutral-100 rounded">
                        <span className="font-bold">Built by </span>
                        {pkg.author.name}
                      </span>
                      <span>
                        {fullPkg.package.downloads}
                        {` download${fullPkg.package.downloads > 1 ? "s" : ""}`}
                      </span>
                    </section>

                    <section className="mt-4">
                      <h2 className="text-2xl font-bold">Installation</h2>
                      <pre className="text-white bg-black shell mt-4">
                        <code>
                          ligo install{" "}
                          <strong className="has-text-white">{pkg.name}</strong>
                        </code>
                      </pre>
                    </section>
                    {fullPkg.package.readme !== null && (
                      <section className="mt-4">
                        <h2 className="text-2xl font-bold">Readme</h2>
                        <div className="box content p-6 mt-4">
                          <ReactMarkdown>
                            {fullPkg.package.readme.replaceAll("\\n", "\n")}
                          </ReactMarkdown>
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="w-2/6 pl-5">
                    <section className="mb-6">
                      <EnquirementButton
                        version={pkg.version}
                        packageName={pkg.name}
                        requested={requestedAudits}
                      />
                    </section>
                    {renderedLinks.length > 0 ? (
                      <aside className="menu">
                        <h2 className="text-xl font-bold">Links</h2>
                        <ul className="mt-2 space-y-2">{renderedLinks}</ul>
                      </aside>
                    ) : (
                      <></>
                    )}
                    {/* {pkg.keywords.length > 0 && (
                      <>
                        <h2 className="title is-5 mt-6">Keywords</h2>
                        {pkg.keywords.map((tag: string, i: number) => (
                          <span key={i} className="keyword tag p-2 m-1">
                            {tag}
                          </span>
                        ))}
                      </>
                    )} */}
                    <RequestedAuditsList requests={requestedAudits} />
                  </div>
                </div>
              </div>
            </section>
          );
      })()}
    </PageContainer>
  );
};

export default ViewPackage;
