import { Link } from "react-router-dom";
import { viewbox } from "../../types/size";
import ChainHeightButton from "../elements/ChainHeightButton";
import Ligo from "../images/Ligo";

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <nav
          className="navbar is-mobile"
          role="navigation"
          aria-label="main navigation"
        >
          <a href="/" className="navbar-brand">
            <h1 className="title columns is-mobile m-0">
              <div className="column is-vcentered is-narrow">
                <Ligo
                  width={40}
                  height={40}
                  viewBox={viewbox(0, 0, 60, 60)}
                  fill="#0E74FF"
                />
              </div>
              <div className="column is-vcenteredis-narrow is-uppercase">
                <span className="has-text-weight-bold">Ligo</span>
                <span className="has-text-weight-medium">Registry</span>
              </div>
            </h1>
          </a>
          <div className="navbar-menu is-active">
            <div className="navbar-end is-vcentered">
              <Link className="navbar-item" to="packages">
                Packages
              </Link>

              <a className="navbar-item" href="http://ligolang.org/">
                About Ligo
              </a>
              <a
                className="navbar-item"
                href="https://ligolang.org/docs/advanced/package-management"
              >
                How to use
              </a>
              <div className="navbar-item">
                <ChainHeightButton />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
