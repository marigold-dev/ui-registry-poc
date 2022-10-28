import { Package } from "./types";

const breathalyzerReadme = `
# breathalyzer

A simple test framework for Ligo Lang, the name \`breathalyzer\` is a wink to
[Alcotest](https://github.com/mirage/alcotest), a powerful test framework for
the OCaml language.

The best way to understand the design and use of **Breathalyzer** is to consult
the various examples in the [\`examples/\`](examples/) directory.

## Some examples

The test framework is tested with itself, however, there are several fairly
explicit examples of how to run a test suite:

- [List](examples/simple): A fairly simple demonstration that shows how to make
  simple assertions. A library is declared and some test cases are provided
  which check the behaviour of the functions.
- [Auction](examples/auction): A slightly more complicated test suite that
  demonstrates the notion of **context**, how to _act as an actor_ and how to
  wait (\`Expect\`) for an error from the transfer execution to a smart-contract.
- [Ticket factory](examples/auction): An example that takes advantage of tickets
  and the exploitation of multiple contracts. A real (partly real-world) example
  that attempts to use all the features of the testing framework.
`;

const breathalyzer: Package = {
  name: "ligo-breathalyzer",
  description: "A simple test framework for Ligo Lang",
  license: "MIT",
  isFeatured: true,
  versions: ["0.0.1", "1.0.0"],
  website: "https://github.com/marigold-dev/breathalyzer",
  repository: {
    forge: "github",
    account: "marigold-dev",
    repository: "breathalyzer",
  },
  author: "Marigold <contact@marigold.dev>",
  downloads: 48,
  keywords: ["ligo", "tezos", "tezos-ligo", "cameligo"],
  readme: breathalyzerReadme,
};

const breathalyzer2: Package = {
  name: "ligo-breathalyzer2",
  description: "An other simple test framework for Ligo Lang",
  license: "MIT",
  isFeatured: false,
  versions: ["0.0.1", "2.4.5"],
  website: "https://github.com/marigold-dev/breathalyzer",
  repository: {
    forge: "github",
    account: "marigold-dev",
    repository: "breathalyzer",
  },
  author: "Marigold <contact@marigold.dev>",
  downloads: 64,
  keywords: ["ligo", "tezos", "tezos-ligo", "cameligo"],
  readme: breathalyzerReadme,
};

export const allPackages = async (): Promise<Package[]> =>
  await [
    breathalyzer,
    breathalyzer2,
    breathalyzer,
    breathalyzer,
    breathalyzer2,
  ];

export const allFeaturedPackages = async (): Promise<Package[]> => {
  const list = await allPackages();
  return list.filter((aPackage: Package) => aPackage.isFeatured);
};

export const allSortedByDownloadPackages = async (): Promise<Package[]> => {
  const list = await allPackages();
  return list.sort(
    (aPackage: Package, anOtherPackage: Package) =>
      anOtherPackage.downloads - aPackage.downloads
  );
};

export const getOnePackage = async (
  target: string
): Promise<Package | null> => {
  const list = await allPackages();
  const findedPackage = list.find(
    (aPackage: Package) => target === aPackage.name
  );
  return findedPackage === undefined ? null : findedPackage;
};
