import { GetStaticPropsContext } from "next";
import { Search } from "../../src/components";
import templates from "../../src/mock/templates";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: { data: templates.categories.tokens },
    revalidate: 60,
  };
}

export default Search;
