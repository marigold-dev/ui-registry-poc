import { GetStaticPropsContext } from "next";
import { getTemplates } from "../../server/templates";
import { Search } from "../../src/components";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: {
      data: (await getTemplates()).filter(
        (template) => template.category === "utilities"
      ),
    },
    revalidate: 60,
  };
}

export default function Utilities({ data }: any) {
  return (
    <Search
      data={data}
      title="Explore utilities"
      description="Utilities illustrate useful patterns like randomness or updatable contracts"
    />
  );
}
