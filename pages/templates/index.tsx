import { GetStaticPropsContext } from "next";
import { getTemplates } from "../../server/templates";
import { Search } from "../../src/components";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: { data: getTemplates() },
    revalidate: 60,
  };
}

export default function Templates({ data }: any) {
  return (
    <Search
      title="Explore all"
      description="Contract templates help you to kickstart you project with contracts crafted & reviewed by Tezos Community"
      data={data}
    />
  );
}
