import { GetStaticPropsContext } from "next";
import { Search } from "../../src/components";
import templates from "../../src/mock/templates";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return {
    props: { data: templates.categories.utilities },
    revalidate: 60,
  };
}

export default Search({
  title: "Explore utilities",
  description:
    "Utilities illustrate useful patterns like randomness or updatable contracts",
});
