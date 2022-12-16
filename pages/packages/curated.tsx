import { GetStaticPropsContext } from "next";
import { Search } from "../../src/components";
import { allFeaturedPackages } from "../../src/mock/data";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return allFeaturedPackages()
    .then((data) => ({
      props: { data },
      revalidate: 60,
    }))
    .catch(() => ({
      props: { data: [] },
      revalidate: 60,
    }));
}

export default Search();
