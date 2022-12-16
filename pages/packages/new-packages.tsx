import { GetStaticPropsContext } from "next";
import { Search } from "../../src/components";
import { allPackages } from "../../src/mock/data";

export async function getStaticProps(_context: GetStaticPropsContext) {
  return allPackages()
    .then((data) => ({
      props: {
        data: data.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        ),
      },
      revalidate: 60,
    }))
    .catch(() => ({
      props: { data: [] },
      revalidate: 60,
    }));
}

export default Search();
