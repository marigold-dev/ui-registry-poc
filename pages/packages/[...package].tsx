import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Requested } from "../../src/api/AuditorSc/ProceededStorage";
import { forOnePackage } from "../../src/api/AuditorSc/Views";
import EnquirementButton from "../../src/components/elements/EnquirementButton";
import RequestedAuditsList from "../../src/components/elements/RequestedAuditsList";
import { useAuditor } from "../../src/context/AuditorContext";
import { allPackages, getOnePackage } from "../../src/mock/data";
import { Package } from "../../src/mock/types";
import { Repository } from "../../src/mock/types";
import { resolveRepositoryUrl } from "../../src/util/Resolver";

export async function getStaticPaths() {
  return allPackages()
    .then((packages) => {
      return {
        paths: packages.map((p) => ({
          params: { package: p.name.split("/") },
        })),
        fallback: true,
      };
    })
    .catch(() => ({
      paths: [],
      fallback: true,
    }));
}

export async function getStaticProps(context: GetStaticPropsContext) {
  return getOnePackage((context.params!.package as string[]).join("/"))
    .then((pkg) => {
      return {
        props: {
          pkg,
        },
        revalidate: 60,
      };
    })
    .catch(() => {
      return {
        notFound: true,
      };
    });
}

const ViewPackage = ({ pkg }: { pkg: Package }) => {
  const router = useRouter();

  const state = useAuditor();

  const [fallbackPackage, setFallbackPackage] = useState<Package | null>(null);

  const [requestedAudits, setRequestedAudits] = useState<Requested[] | null>(
    null
  );

  const fullPkg = router.isFallback ? fallbackPackage : pkg;

  useEffect(() => {
    if (!router.isFallback) return;

    getOnePackage(router.asPath.replace(/^\/packages\//, ""))
      .then(setFallbackPackage)
      .catch(() => {
        router.push("/");
      });
  }, []);

  useEffect(() => {
    let subscription = true;

    if (state.type === "BOOTED" && fullPkg !== null) {
      const contract = state.contract;
      if (contract.type === "CONTRACT_LINKED") {
        if (subscription) {
          const makeLookup = async () => {
            try {
              const packageName = fullPkg.name;
              const version = fullPkg.versions[fullPkg["dist-tags"].latest];
              const requested = await forOnePackage(
                contract.contract,
                packageName,
                version.version
              );
              setRequestedAudits(requested);
            } catch (e) {
              console.log(e);
            }
          };
          makeLookup();
        }
      }
    }
    return () => {
      subscription = false;
    };
  }, [fullPkg, state]);

  const versionPkg = fullPkg?.versions[fullPkg["dist-tags"]?.latest];

  const links = [versionPkg?.website, versionPkg?.repository].filter(
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
    <>
      <Head>
        <title>Ligo Package Registry - {fullPkg?.name ?? ""}</title>
        <meta name="description" content={fullPkg?.readme.substring(0, 155)} />
      </Head>
      {(() => {
        if (!versionPkg)
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
                <h1 className="text-2xl md:text-3xl font-bold text-ligo">
                  {versionPkg.name}
                  <span className="ml-2 font-light text-base">
                    {"v" + versionPkg.version}
                  </span>
                </h1>
                <h2 className="mt-1 text-md md:text-xl">
                  {versionPkg.description}
                </h2>
                <div className="mt-4 flex flex-col md:flex-row">
                  <div className="w-full md:w-4/6">
                    <section className="mb-2 md:mb-6 package-meta space-x-4">
                      {!!fullPkg.license && (
                        <span className="tag is-medium">{fullPkg.license}</span>
                      )}
                      <span className="text-lg p-2 bg-neutral-100 rounded">
                        <span className="font-bold">Built by </span>
                        {versionPkg.author?.name ?? "Unknown"}
                      </span>
                      <span>
                        {fullPkg.downloads}
                        {` download${fullPkg.downloads > 1 ? "s" : ""}`}
                      </span>
                    </section>

                    <section className="mt-4">
                      <h2 className="text-2xl font-bold">Installation</h2>
                      <pre className="text-white bg-black shell mt-4 rounded">
                        <code>
                          ligo install{" "}
                          <strong className="has-text-white">{`${versionPkg.name}  `}</strong>
                        </code>
                      </pre>
                    </section>
                    {fullPkg.readme !== null && (
                      <section className="mt-4">
                        <h2 className="text-2xl font-bold">Readme</h2>
                        <div className="p-3 md:p-6 mt-4 bg-white drop-shadow-xl rounded">
                          <ReactMarkdown
                            className="prose max-w-none"
                            components={{
                              a: ({ children, href, title }) => (
                                <a
                                  href={href}
                                  title={title}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                            transformLinkUri={(href) => {
                              if (href.includes("http")) return href;

                              return `${(
                                (!!(versionPkg.repository as Repository)?.url
                                  ? (versionPkg.repository as Repository).url
                                  : (versionPkg.repository as string)) ?? ""
                              ).replace(".git", "")}/tree/main/${href}`;
                            }}
                            transformImageUri={(href) => {
                              const repoName = (
                                (!!(versionPkg.repository as Repository).url
                                  ? (versionPkg.repository as Repository).url
                                  : (versionPkg.repository as string)) ?? ""
                              )
                                .replace(".git", "")
                                .replace("https://github.com/", "");

                              return `https://raw.githubusercontent.com/${repoName}/main/${href}`;
                            }}
                          >
                            {fullPkg.readme.replace(/\\n/g, "\n")}
                          </ReactMarkdown>
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="w-full md:w-2/6 md:pl-5">
                    <section className="mb-6">
                      <EnquirementButton
                        version={versionPkg.version}
                        packageName={versionPkg.name}
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
    </>
  );
};

export default ViewPackage;
