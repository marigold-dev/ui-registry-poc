import mermaid from "mermaid";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Requested } from "../../src/api/AuditorSc/ProceededStorage";
import { Mermaid } from "../../src/components";
import { useAuditor } from "../../src/context/AuditorContext";
import templates from "../../src/mock/templates";
import { Template } from "../../src/mock/types";

mermaid.initialize({ startOnLoad: false });

export async function getStaticPaths() {
  return {
    paths: Object.keys(templates.map).map((template) => ({
      params: {
        template,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const template = templates.map[context.params!.template as string];

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

const ViewPackage = ({ template }: { template: Template | null }) => {
  const router = useRouter();

  const state = useAuditor();

  const [requestedAudits, setRequestedAudits] = useState<Requested[] | null>(
    null
  );

  useEffect(() => {
    if (!router.isFallback && !!template) return;

    router.push("/");
  }, []);

  return (
    <>
      <Head>
        <title>Ligo Package Registry - {template?.name ?? ""}</title>
        <meta name="description" content={template?.description} />
      </Head>

      <section>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ligo">
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
              </section>

              <section className="mt-4">
                <h2 className="text-2xl font-bold">Installation</h2>
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

                        return `${template.repository}${href}`;
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
                </section>
              )}
            </div>

            <div className="w-full md:w-2/6 md:pl-5 space-y-4">
              <button
                onClick={() => {
                  console.log("");
                }}
                className="bg-ligo hover:bg-ligo-dark rounded px-2 py-3 text-white font-bold"
              >
                Deploy this template
              </button>
              <aside className="menu">
                <h2 className="text-xl font-bold">Links</h2>
                <ul className="mt-2 space-y-2">
                  <li>
                    <a
                      href={template?.repository}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-ligo"
                    >
                      Repository
                    </a>
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
