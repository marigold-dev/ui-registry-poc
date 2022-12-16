import { GetStaticPropsContext } from "next";
import { Search } from "../../src/components";
import templates from "../../src/mock/templates";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: { data: templates.categories.all },
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
