import { viewbox } from "../../types/size";
import { exploreAuditorSc } from "../../util/Resolver";
import Marigold from "../images/Marigold";

const Footer = () => {
  return (
    <div className="w-full py-8 absolute bottom-0 left-0 right-0 bg-white h-36 z-50 px-2">
      <div className="max-w-7xl flex flex-col md:flex-row justify-between m-auto px-8 lg:px-0">
        <nav>
          <ul className="flex flex-col items-center md:block">
            <li>
              <a
                className="text-black hover:text-ligo"
                target="_blank"
                rel="noreferrer"
                href="http://ligolang.org/"
              >
                About Ligo
              </a>
            </li>
            <li>
              <a
                className="text-black hover:text-ligo"
                target="_blank"
                rel="noreferrer"
                href="https://ligolang.org/docs/advanced/package-management"
              >
                How to use
              </a>
            </li>
            <li>
              <a
                className="text-black hover:text-ligo"
                target="_blank"
                rel="noreferrer"
                href={exploreAuditorSc}
              >
                Auditor Smart-contract
              </a>
            </li>
            <li>
              <a
                className="text-black hover:text-ligo"
                target="_blank"
                rel="noreferrer"
                href="https://github.com/marigold-dev/auditor"
              >
                Source code
              </a>
            </li>
          </ul>
        </nav>

        <a
          href="https://marigold.dev"
          className="text-black flex flex-col items-center md:items-start md:flex-row mt-4 md:mt-0"
          target="_blank"
          rel="noreferrer"
        >
          <div className="text-center md:text-right">
            <div>Proudly powered by</div>
            <h2 className="text-2xl">Marigold</h2>
          </div>
          <div className="px-4 py-1">
            <Marigold
              width={50}
              height={50}
              viewBox={viewbox(0, 0, 25, 25)}
              fill="#F25430"
            />
          </div>
        </a>
      </div>
    </div>
  );
};

export default Footer;
