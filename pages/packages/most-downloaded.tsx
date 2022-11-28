import { GetStaticPropsContext } from "next";
import { Search } from "../../src/components";
import { allSortedByDownloadPackages } from "../../src/mock/data";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return allSortedByDownloadPackages()
    .then((packages) => ({
      props: {
        packages,
      },
      revalidate: 60,
    }))
    .catch(() => ({
      props: { packages: [] },
      revalidate: 60,
    }));
}

export default Search;
