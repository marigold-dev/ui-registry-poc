import { GetStaticPropsContext } from "next";
import { Search } from "../../src/components";
import templates from "../../src/mock/templates";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: { data: templates.categories.governance },
    revalidate: 60,
  };
}

export default function Governance({ data }: any) {
  return (
    <Search
      data={data}
      title="Explore governance"
      description="Governance templates help you to empower your decentralized community with multisig or DAO"
    />
  );
}
