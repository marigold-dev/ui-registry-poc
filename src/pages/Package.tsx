import { getOnePackage } from "../mock/data";
import { Package } from "../mock/types";
import { useLoaderData } from "react-router-dom";
import Error from "./Error";
import ReactMarkdown from "react-markdown";
import { Repository } from "../mock/types";
import { resolveRepositoryUrl } from "../util/Resolver";
import { useAuditor } from "../context/AuditorContext";
import { useEffect, useState } from "react";
import { forOnePackage } from "../api/AuditorSc/Views";
import EnquirementButton from "../components/elements/EnquirementButton";
import { Requested } from "../api/AuditorSc/ProceededStorage";
import { Link } from "react-router-dom";
import RequestedAuditsList from "../components/elements/RequestedAuditsList";

type FullPackage = {
  package: Package;
};

export const loadPackage = async ({
  params,
}: any): Promise<FullPackage | null> => {
  const pkg = await getOnePackage(params["*"]);
  if (pkg === null) {
    return null;
  }
  return { package: pkg };
};

const ViewPackage = () => {
  const fullPkg = useLoaderData() as FullPackage | null;

  const state = useAuditor();
  const [requestedAudits, setRequestedAudits] = useState<Requested[] | null>(
    null
  );

  // We should use different Context in order to provide specific states
  // if the application can be booted.

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

  if (fullPkg === null) {
    return (
      <Error
        title="Error 404"
        subtitle="Package not found"
        message="The package cannot be found, it must be an indexing error... this is very annoying..."
      />
    );
  }

  const pkg = fullPkg.package.versions[fullPkg.package["dist-tags"].latest];

  const links = [pkg.website, pkg.repository].filter(
    (e: string | Repository | null | undefined) => !!e
  ) as (string | Repository)[];

  const renderedLinks = links.map((e: string | Repository, i: number) => {
    console.log(e);
    const { url, name } =
      typeof e === "string"
        ? { url: e, name: "Website" }
        : resolveRepositoryUrl(e);
    return (
      <li key={i}>
        <a href={url} target="_blank">
          {name}
        </a>
      </li>
    );
  });

  return (
    <section className="hero">
      <div className="hero-body">
        <Link to="/">Homepage</Link>
        <h1 className="title">
          {pkg.name}
          <span className="ml-2 has-text-weight-light">
            {"v" + pkg.version}
          </span>
        </h1>
        <h2 className="subtitle">{pkg.description}</h2>
        <div className="columns">
          <div className="column is-8">
            <section className="mb-6 package-meta">
              {!!fullPkg.package.license && (
                <span className="tag is-medium">{fullPkg.package.license}</span>
              )}
              <span className="tag is-medium author">{pkg.author.name}</span>
              <span className="tag is-medium is-white download">
                {fullPkg.package.downloads}
              </span>
            </section>

            <section className="mt-4">
              <h2 className="title is-4">Installation</h2>
              <pre className="has-background-black has-text-white shell">
                <code>
                  ligo install{" "}
                  <strong className="has-text-white">{pkg.name}</strong>
                </code>
              </pre>
            </section>
            {fullPkg.package.readme !== null && (
              <section className="mt-6">
                <h2 className="title is-4">Readme</h2>
                <div className="box content p-6">
                  <ReactMarkdown>
                    {fullPkg.package.readme.replaceAll("\\n", "\n")}
                  </ReactMarkdown>
                </div>
              </section>
            )}
          </div>

          <div className="column is-4 is-medium pl-5">
            <section className="mb-6">
              <EnquirementButton
                version={pkg.version}
                packageName={pkg.name}
                requested={requestedAudits}
              />
            </section>
            {renderedLinks.length > 0 ? (
              <aside className="menu">
                <h2 className="title is-5">Links</h2>
                <ul className="menu-list">{renderedLinks}</ul>
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
};

export default ViewPackage;
