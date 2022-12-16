import { GetStaticPropsContext } from "next";
import { Search } from "../../src/components";
import templates from "../../src/mock/templates";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: { data: templates.categories.tokens },
    revalidate: 60,
  };
}

export default Search({
  title: "Explore token",
  description:
    "Token templates help you to quickly release your fungible or non-fungible token project following tezos Financial Assets standards",
});
