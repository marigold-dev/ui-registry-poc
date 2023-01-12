import { GetStaticPropsContext } from "next";
import { getTemplates } from "../../server/templates";
import { Search } from "../../src/components";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: {
      data: (await getTemplates()).filter(
        (template) => template.category === "token"
      ),
    },
    revalidate: 60,
  };
}

export default function Token({ data }: any) {
  return (
    <Search
      data={data}
      title="Explore token"
      description="Token templates help you to quickly release your fungible or non-fungible token project following tezos Financial Assets standards"
    />
  );
}
