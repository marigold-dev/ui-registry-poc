import mermaid from "mermaid";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getTemplates } from "../../server/templates";
import {
  Copy,
  Dropdown,
  Icon,
  Mermaid,
  Spinner,
  TemplateInformations,
} from "../../src/components";
import { IconName } from "../../src/components/elements/Icon";
import { Template } from "../../src/mock/types";

mermaid.initialize({ startOnLoad: false });

export async function getStaticPaths() {
  return {
    paths: (await getTemplates()).map((template) => ({
      params: {
        template: template.name,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const template = (await getTemplates()).find(
    (template) => template.name === (context.params!.template as string)
  );

  if (!template)
    return {
      notFound: true,
    };

  return {
    props: {
      template,
    },
  };
}

const ViewPackage = ({ template }: { template: Template }) => {
  const router = useRouter();

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState("");
  const [contracts, setContracts] = useState<
    { address: string; name?: string }[]
  >([]);

  const [endpoints, setEndpoints] = useState(template.endpoints[0]);

  useEffect(() => {
    if (!router.isFallback && !!template) return;

    router.push("/");
  }, []);

  useEffect(() => {
    const contracts = localStorage.getItem(`@ligo/${template.name}`);

    setContracts(JSON.parse(!!contracts ? contracts : "[]"));
  }, []);

  return (
    <>
      <Head>
        <title>Ligo Package Registry - {template?.name ?? ""}</title>
        <meta name="description" content={template?.description} />
      </Head>

      <section>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ligo-600">
            {template?.name}
            <span className="ml-2 font-light text-base">
              {"v" + template?.version}
            </span>
          </h1>
          <h2 className="mt-1 text-md md:text-xl">{template?.description}</h2>
          <div className="mt-4 flex flex-col md:flex-row">
            <div className="w-full md:w-4/6">
              <section className="mb-2 md:mb-6 package-meta space-x-4">
                <span className="text-lg p-2 bg-neutral-100 rounded">
                  <span className="font-bold">Built by </span>
                  {template?.author.name ?? "Unknown"}
                </span>
                <span className="text-lg p-2 bg-neutral-100 rounded">
                  <span className="font-bold">License </span>
                  MIT
                </span>
              </section>

              <section className="mt-4">
                <h2 className="text-2xl font-bold">Use template</h2>
                <pre className="text-white bg-slate-800 shell mt-4 px-3 py-4 rounded">
                  <code>
                    ligo init contract --template{" "}
                    <strong className="text-white">
                      {template?.name.toLowerCase()}
                    </strong>{" "}
                    [PROJECT_NAME]
                  </code>
                </pre>
              </section>
              {!!template?.readme && (
                <section className="mt-4">
                  <h2 className="text-2xl font-bold">Readme</h2>
                  <div className="box content mt-4">
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
                        code: ({ children, className }) => {
                          return className?.includes("mermaid") ? (
                            <Mermaid>
                              {(children as string[]).join(" ")}
                            </Mermaid>
                          ) : (
                            <code className={className}>{children}</code>
                          );
                        },
                      }}
                      transformLinkUri={(href) => {
                        if (href.includes("http")) return href;

                        return `${template.repository}/tree/main/${href}`;
                      }}
                      transformImageUri={(href) => {
                        const repoName = template.repository.replace(
                          "https://github.com/",
                          ""
                        );

                        return `https://raw.githubusercontent.com/${repoName}/main/${href}`;
                      }}
                    >
                      {template.readme.replace(/\\n/g, "\n")}
                    </ReactMarkdown>
                  </div>
                  <div className="relative bg-white w-full rounded drop-shadow px-4 py-4 mt-4 z-30">
                    <div className="flex justify-between">
                      <h3 className="text-2xl font-bold">
                        Contract informations
                      </h3>
                      {template.endpoints.length > 1 ? (
                        <div className="w-1/4">
                          <Dropdown
                            options={template.endpoints.map(({ contract }) => ({
                              label: contract,
                              value: contract,
                            }))}
                            onChange={(value) => {
                              if (endpoints.contract === value) return;
                              const found = template.endpoints.find(
                                ({ contract }) => contract === value
                              );

                              if (!found) return;

                              setEndpoints(found);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                    <TemplateInformations
                      endpoints={endpoints.params}
                      files={template.files}
                    />
                  </div>
                </section>
              )}
            </div>

            <div className="w-full md:w-2/6 md:pl-5 space-y-4 mt-4 md:mt-0">
              <div>
                {contracts.length > 0 && (
                  <>
                    <div className="border-ligo border-4 rounded px-2 py-3 inline-block w-full lg:w-auto overflow-x-auto">
                      {contracts.length > 1 ? (
                        <ul className="space-y-2">
                          {contracts.map(({ name, address }) => (
                            <li className="flex items-center space-x-2">
                              <span className="font-bold">{name}:</span>{" "}
                              <Copy value={address}>
                                <a
                                  href={`https://ghostnet.tzkt.io/${address}`}
                                  className="text-ligo-600 text-underline hover:text-ligo-700"
                                  rel="noreferrer"
                                  target="_blank"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {`${address.substring(
                                    0,
                                    5
                                  )}...${address.substring(
                                    address.length - 5
                                  )}`}
                                </a>
                              </Copy>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Copy value={contracts[0].address} className="">
                          <a
                            href={`https://ghostnet.tzkt.io/${contracts[0].address}`}
                            className="text-ligo-600 text-underline hover:text-ligo-700"
                            rel="noreferrer"
                            target="_blank"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {`${contracts[0].address.substring(
                              0,
                              5
                            )}...${contracts[0].address.substring(
                              contracts[0].address.length - 5
                            )}`}
                          </a>
                        </Copy>
                      )}
                    </div>
                    <a
                      href="#"
                      className="text-ligo-600 hover:text-ligo-600-700 block"
                      onClick={(e) => {
                        e.preventDefault();
                        localStorage.setItem(`@ligo/${template.name}`, "");
                        setContracts([]);
                      }}
                    >
                      Clear contract
                    </a>
                  </>
                )}

                {contracts.length === 0 && (
                  <button
                    className={`flex justify-center bg-ligo-600 hover:bg-ligo-700 rounded px-2 py-3 text-white font-bold relative
                ${isDeploying ? "pointer-events-none" : ""}`}
                    onClick={() => {
                      if (isDeploying) return;

                      setIsDeploying(true);
                      fetch(`/api/deploy?template=${template.name}`, {
                        method: "POST",
                      })
                        .then((res) => res.json())
                        .then((res) => {
                          setIsDeploying(false);
                          localStorage.setItem(
                            `@ligo/${template.name}`,
                            JSON.stringify(res)
                          );

                          setContracts(res);
                        })
                        .catch((err) => {
                          console.log(err);
                          setIsDeploying(false);
                          setDeployError(err);
                        });
                    }}
                  >
                    <span className={isDeploying ? "opacity-0" : "opacity-100"}>
                      Deploy template
                    </span>
                    {isDeploying && (
                      <Spinner className="w-6 h-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </button>
                )}
                {isDeploying && (
                  <span className="text-sm mt-1 text-slate-600">
                    It may takes few minutes to deploy
                  </span>
                )}
                {!!deployError && (
                  <span className="text-sm mt-1 text-red-500">
                    {deployError}
                  </span>
                )}
              </div>
              <aside className="menu">
                <h2 className="text-xl font-bold">Links</h2>
                <ul className="mt-2 space-y-2">
                  <li>
                    <a
                      href={template?.repository}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-ligo-600"
                    >
                      Repository
                    </a>
                  </li>
                </ul>
              </aside>
              <aside className="menu mt-4">
                <h2 className="text-xl font-bold">Permissions</h2>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center space-x-1">
                    <Icon
                      name={IconName.Check}
                      className="w-4 h-4 text-green-500"
                    />
                    <span>Commercial use</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Icon
                      name={IconName.Check}
                      className="w-4 h-4 text-green-500"
                    />
                    <span>Modification</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Icon
                      name={IconName.Check}
                      className="w-4 h-4 text-green-500"
                    />
                    <span>Distribution</span>
                  </li>
                  <li className="flex items-center space-x-1">
                    <Icon
                      name={IconName.Check}
                      className="w-4 h-4 text-green-500"
                    />
                    <span>Private use</span>
                  </li>
                </ul>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ViewPackage;
