import { NavLink, useNavigate } from "react-router-dom";
import { viewbox } from "../../types/size";
import ChainHeightButton from "../elements/ChainHeightButton";
import Ligo from "../images/Ligo";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `p-2 rounded ${
    isActive ? "text-ligo" : ""
  } hover:bg-neutral-100 hover:text-ligo`;

const Header = () => {
  const navigate = useNavigate();

  return (
    <nav
      className="w-full fixed top-0 left-0 right-0 h-20 bg-white drop-shadow z-50 flex justify-center"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="max-w-7xl flex items-center justify-between w-full h-full">
        <NavLink to="/" className="navbar-brand">
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
        </NavLink>
        <div className="flex items-center space-x-2">
          <input
            placeholder="Search"
            className="w-56 h-8 border p-4 rounded-full mr-2"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;

              navigate(
                `/packages?search=${(e.target as HTMLInputElement).value}`
              );
            }}
          />
          <NavLink className={navLinkClass} to="/" end>
            Home
          </NavLink>

          <NavLink className={navLinkClass} to="packages" end>
            Packages
          </NavLink>

          <a
            className={navLinkClass({ isActive: false })}
            href="http://ligolang.org/"
            target="_blank"
            rel="noreferrer"
          >
            About Ligo
          </a>
          <a
            className={navLinkClass({ isActive: false })}
            href="https://ligolang.org/docs/advanced/package-management"
            target="_blank"
            rel="noreferrer"
          >
            How to use
          </a>

          <ChainHeightButton />
        </div>
      </div>
    </nav>
  );
};

export default Header;
