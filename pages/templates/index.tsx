import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { getTemplates } from "../../server/templates";
import { Template } from "../../src/mock/types";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: { data: getTemplates() },
    revalidate: 60,
  };
}

const Card = ({ pkg }: { pkg: Template }) => (
  <div className="card mt-0">
    <Link className="has-text-black" href={`/template/${pkg.name}`}>
      <header className="card-header">
        <p className="card-header-title">{pkg.name}</p>
      </header>
      <div className="card-content mb-auto">
        <div className="content">
          {pkg.description === "" ? "No description" : pkg.description}
        </div>
      </div>
      <div className="card-footer mt-auto">
        <div className="card-footer-item">
          <span className="has-text-weight-light">
            <span className="has-text-weight-light ml-2">v{pkg.version}</span>
          </span>
        </div>
      </div>
    </Link>
  </div>
);

type props = {
  governance: Template[];
  tokens: Template[];
  utilities: Template[];
};

const All = ({ governance, tokens, utilities }: props) => {
  return (
    <>
      <Head>
        <title>Search Package - LIGO Package Registry</title>
        <meta
          name="description"
          content="Search any Ligo package through our registry"
        />
      </Head>

      <>
        <h2 className="text-3xl font-bold">Governance</h2>
        <p className="text-lg text-slate-700 mt-2">
          Governance templates help you to empower your decentralized community
          with multisig or DAO
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
          {governance.map((pkg, i) => (
            <Card pkg={pkg} key={i} />
          ))}
        </div>
        <h2 className="text-3xl font-bold mt-6">Token</h2>
        <p className="text-lg text-slate-700 mt-2">
          Token templates help you to quickly release your fungible or
          non-fungible token project following tezos Financial Assets standards
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
          {tokens.map((pkg, i) => (
            <Card pkg={pkg} key={i} />
          ))}
        </div>
        <h2 className="text-3xl font-bold mt-6">Utilities</h2>
        <p className="text-lg text-slate-700 mt-2">
          Utilities illustrate useful patterns like randomness or updatable
          contracts
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
          {utilities.map((pkg, i) => (
            <Card pkg={pkg} key={i} />
          ))}
        </div>
      </>
    </>
  );
};

export default All;
