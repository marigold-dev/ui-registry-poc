import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { viewbox } from "../../types/size";
import ChainHeightButton from "../elements/ChainHeightButton";
import Ligo from "../images/Ligo";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `p-2 rounded ${
    isActive ? "text-ligo" : ""
  } hover:bg-neutral-100 hover:text-ligo`;

const Header = () => {
  const router = useRouter();
  const [hasNav, setHasNav] = useState(false);

  const removeNav = () => {
    if (!hasNav) return;

    setHasNav(false);
  };
  return (
    <nav
      className={`w-full fixed top-0 left-0 right-0 ${
        hasNav ? "h-auto" : "h-20"
      } bg-white drop-shadow z-50 flex justify-center overflow-hidden md:overflow-visible`}
      role="navigation"
      aria-label="main navigation"
    >
      <div className="max-w-7xl px-4 md:px-0 flex items-center justify-between flex-wrap md:flex-no-wrap w-full h-full">
        <Link
          href="/"
          className="mt-4 md:mt-0 md:-translate-y-2"
          onClick={removeNav}
        >
          <h1 className="flex items-center">
            <Ligo
              width={40}
              height={40}
              viewBox={viewbox(0, 0, 60, 60)}
              fill="#0E74FF"
            />
            <div className="uppercase ml-4 text-xl md:text-3xl">
              <span className="font-bold">Ligo</span>
              <span className="font-medium">Registry</span>
            </div>
          </h1>
        </Link>
        <button
          className={`md:hidden mt-4 md:mt-0 flex items-center hamburger hamburger--spin ${
            hasNav ? "is-active" : ""
          }`}
          onClick={() => setHasNav(!hasNav)}
        >
          <span className="hamburger-box">
            <span className="hamburger-inner bg-neutral-700 before:bg-neutral-700 after:bg-neutral-700"></span>
          </span>
        </button>
        <div className="flex flex-col w-full space-y-2 md:space-y-0 py-4 md:py-0 md:w-auto md:flex-row items-center justify-center md:justify-start space-x-2">
          <input
            placeholder="Search"
            className="w-full md:w-56 h-8 border p-4 rounded-full mr-2"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;

              const target = e.target as HTMLInputElement;

              router.push(`/packages?search=${target.value}`);

              target.value = "";
              target.blur();
            }}
          />
          <Link
            className={navLinkClass({ isActive: router.pathname === "/" })}
            href="/"
            onClick={removeNav}
          >
            Home
          </Link>

          <Link
            className={navLinkClass({
              isActive: router.pathname === "/packages",
            })}
            href="/packages"
            onClick={removeNav}
          >
            Packages
          </Link>

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
