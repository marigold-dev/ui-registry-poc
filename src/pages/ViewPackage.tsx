import { getOnePackage } from "../mock/data";
import { Package } from "../mock/types";
import { useLoaderData } from "react-router-dom";
import Error from "./Error";
import ReactMarkdown from "react-markdown";
import { Repository } from "../types/common";
import { resolveRepositoryUrl } from "../util/Resolver";
import { useAuditor } from "../context/AuditorContext";
import { useEffect, useState } from "react";
import { forOne } from "../api/AuditorSc/Views";
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
  const pkg = await getOnePackage(params.packageName);
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

  useEffect(() => {
    let subscription = true;
    console.log("test");

    if (state.type === "BOOTED" && fullPkg !== null) {
      const contract = state.contract;
      if (contract.type === "CONTRACT_LINKED") {
        if (subscription) {
          const makeLookup = async () => {
            const packageName = fullPkg.package.name;
            const version = fullPkg.package.versions.slice(-1)[0];
            const x = await forOne(
              contract.contract,
              contract.storage,
              packageName,
              version
            );
            console.log(x);
            setRequestedAudits(x);
          };
          makeLookup();
        }
      }
    }
    return () => {
      subscription = false;
    };
  }, [state, fullPkg]);

  if (fullPkg === null) {
    return (
      <Error
        title="Error 404"
        subtitle="Package not found"
        message="The package cannot be found, it must be an indexing error... this is very annoying..."
      />
    );
  }

  const pkg = fullPkg.package;

  const links = [pkg.website, pkg.repository].filter(
    (e: string | Repository | null) => e !== null
  ) as (string | Repository)[];

  const renderedLinks = links.map((e: string | Repository, i: number) => {
    const { url, name } =
      typeof e === "string"
        ? { url: e, name: "Website" }
        : resolveRepositoryUrl(e);
    return (
      <li key={i}>
        <a href={url}>{name}</a>
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
            {"v" + pkg.versions.slice(-1)}
          </span>
        </h1>
        <h2 className="subtitle">{pkg.description}</h2>
        <div className="columns">
          <div className="column is-8">
            <section className="mb-6 package-meta">
              {pkg.isFeatured ? (
                <span className="tag is-info is-medium">featured package</span>
              ) : (
                <></>
              )}
              {pkg.license !== null ? (
                <span className="tag is-medium">{pkg.license}</span>
              ) : (
                <></>
              )}
              <span className="tag is-medium author">{pkg.author}</span>
              <span className="tag is-medium is-white download">
                {pkg.downloads}
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
            {pkg.readme !== null ? (
              <section className="mt-6">
                <h2 className="title is-4">Readme</h2>
                <div className="box content p-6">
                  <ReactMarkdown>{pkg.readme}</ReactMarkdown>
                </div>
              </section>
            ) : (
              <></>
            )}
          </div>

          <div className="column is-4 is-medium pl-5">
            <section className="mb-6">
              <EnquirementButton
                version={pkg.versions.slice(-1)[0]}
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
            {pkg.keywords.length > 0 ? (
              <>
                <h2 className="title is-5 mt-6">Keywords</h2>
                {pkg.keywords.map((tag: string, i: number) => (
                  <span key={i} className="keyword tag p-2 m-1">
                    {tag}
                  </span>
                ))}
              </>
            ) : (
              <></>
            )}
            <RequestedAuditsList requests={requestedAudits} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ViewPackage;
