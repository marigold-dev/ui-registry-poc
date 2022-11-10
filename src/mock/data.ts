import { ENDPOINT_BASE } from "../config";
import { AllPackage, DownloadPackage, Package } from "./types";

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

const addPacakgeDownloads = (p: Package) => {
  return getPackageDownload(p.name)
    .then(({ downloads }: { downloads: number }) => ({
      ...p,
      downloads,
    }))
    .catch((_) => ({ ...p, downloads: 0 }));
};

export const allPackages = (): Promise<AllPackage[]> =>
  fetch(`${ENDPOINT_BASE}/ui/packages`)
    .then(
      (r) => {
        if (r.status === 200) {
          return r.json();
        } else {
          // eslint-disable-next-line no-console
          console.log("/-/ui/packages/ returned", r.status);
          // eslint-disable-next-line no-console
          r.text().then(console.log);
          return [];
        }
      },
      () => []
    )
    .then((p) => Promise.all(p.map(addPacakgeDownloads)));

export const getPackageDownload = (packageName: string) =>
  fetch(`${ENDPOINT_BASE}/api/metrics/downloads/${packageName}`).then(
    (r) => {
      if (r.status === 200) {
        return r.json();
      } else {
        // eslint-disable-next-line no-console
        console.log("/-/api/metrics/top-last-week returned", r.status);
        // eslint-disable-next-line no-console
        r.text().then(console.log);
        return { downloads: 0 };
      }
    },
    () => {
      return { downloads: 0 };
    } // TODO(prometheansacrifice) error handling
  );

export const allFeaturedPackages = (): Promise<AllPackage[]> => {
  return allPackages().then((packages) => {
    return fetch(`${ENDPOINT_BASE}/ui/featured`)
      .then(
        (r) => {
          if (r.status === 200) {
            return r.json();
          } else {
            r.text().then(console.log);
            return [];
          }
        },
        () => [] // TODO(prometheansacrifice) error handling
      )
      .then((featuredPackages: Package[]) => {
        const names = featuredPackages.map((p) => p.name);
        return packages.flatMap((p) => {
          if (names.includes(p.name)) return [{ ...p, isFeatured: true }];
          else return [];
        });
      });
  });
};

// export const allSortedByDownloadPackages = async (): Promise<
//   DownloadPackage[]
// > => {
//   return fetch(`${ENDPOINT_BASE}/api/metrics/top-last-week`)
//     .then(
//       (r) => {
//         if (r.status === 200) {
//           return r.json();
//         } else {
//           // eslint-disable-next-line no-console
//           console.log("/-/api/metrics/top-last-week returned", r.status);
//           // eslint-disable-next-line no-console
//           r.text().then(console.log);
//           return [];
//         }
//       },
//       () => []
//     )
//     .then((packages) => Promise.all(packages.map(addPacakgeDownloads)));
// };
export const allSortedByDownloadPackages = async (): Promise<AllPackage[]> =>
  allPackages().then((p) => p.sort((a, b) => b.downloads - a.downloads));

export const getOnePackage = async (name: string): Promise<Package | null> =>
  fetch(`${ENDPOINT_BASE}/api/${name}`).then(
    (r) => {
      if (r.status === 200) {
        return r.json();
      } else {
        // eslint-disable-next-line no-console
        console.log("/-/api/metrics/top-last-week returned", r.status);
        // eslint-disable-next-line no-console
        r.text().then(console.log);
        return null;
      }
    },
    () => null
  );
