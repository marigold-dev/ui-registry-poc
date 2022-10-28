import { viewbox } from "../../types/size";
import { exploreAuditorSc } from "../../util/Resolver";
import Marigold from "../images/Marigold";

const Footer = () => {
  return (
    <div className="footer has-background-white">
      <div className="container">
        <div className="columns is-desktop">
          <div className="column">
            <nav>
              <ul>
                <li>
                  <a className="has-text-black" href="http://ligolang.org/">
                    About Ligo
                  </a>
                </li>
                <li>
                  <a
                    className="has-text-black"
                    href="https://ligolang.org/docs/advanced/package-management"
                  >
                    How to use
                  </a>
                </li>
                <li>
                  <a className="has-text-black" href={exploreAuditorSc}>
                    Auditor Smart-contract
                  </a>
                </li>
                <li>
                  <a
                    className="has-text-black"
                    href="https://github.com/marigold-dev/auditor"
                  >
                    Source code
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="column is-narrow">
            <a
              href="https://marigold.dev"
              className="columns is-vcentered has-text-black is-mobile"
            >
              <div className="column has-text-right">
                <div className="powered">Proudly powered by</div>
                <h2 className="title is-4">Marigold</h2>
              </div>
              <div className="column is-narrow">
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
      </div>
    </div>
  );
};

export default Footer;
