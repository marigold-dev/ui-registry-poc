import { GetStaticPropsContext } from "next";
import { getTemplates } from "../../server/templates";
import { Search } from "../../src/components";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: {
      data: getTemplates().filter(
        (template) => template.category === "governance"
      ),
    },
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
