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

  return (
    <nav
      className={`w-full fixed top-0 left-0 right-0 h-20 bg-slate-50 z-50 flex justify-center overflow-hidden md:overflow-visible`}
      role="navigation"
      aria-label="main navigation"
    >
      <div className="max-w-7xl px-4 md:px-0 flex items-center justify-between flex-wrap md:flex-no-wrap w-full h-full">
        <div className="flex items-center">
          <Link href="/" className="mt-4 md:mt-0">
            <h1 className="flex items-center">
              <Ligo
                width={40}
                height={40}
                viewBox={viewbox(0, 0, 60, 60)}
                fill="#0E74FF"
              />
              <div className="uppercase ml-2 text-ligo text-xl">
                <span className="font-bold">Ligo</span>
                <span className="font-medium">Registry</span>
              </div>
              <button className="ml-1 px-3 py-1 bg-ligo text-white rounded-full hover:text-white hover:bg-ligo-dark">
                Beta
              </button>
            </h1>
          </Link>
          <input
            placeholder="Search"
            className="w-full md:w-56 h-8 border p-4 rounded-full ml-4"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;

              const target = e.target as HTMLInputElement;

              router.push(`/packages?search=${target.value}`);

              target.value = "";
              target.blur();
            }}
          />
        </div>
        {/* <button
          className={`md:hidden mt-4 md:mt-0 flex items-center hamburger hamburger--spin ${
            hasNav ? "is-active" : ""
          }`}
          onClick={() => setHasNav(!hasNav)}
        >
          <span className="hamburger-box">
            <span className="hamburger-inner bg-neutral-700 before:bg-neutral-700 after:bg-neutral-700"></span>
          </span>
        </button> */}
        <div className="flex flex-col w-full space-y-2 md:space-y-0 py-4 md:py-0 md:w-auto md:flex-row items-center justify-center md:justify-start space-x-2">
          <a
            className={navLinkClass({ isActive: false })}
            href="https://ligolang.org/docs/intro/installation"
            target="_blank"
            rel="noreferrer"
          >
            Install Ligo
          </a>
          <a
            className={navLinkClass({ isActive: false })}
            href="https://ligolang.org/docs/advanced/package-management"
            target="_blank"
            rel="noreferrer"
          >
            Ligo package manager
          </a>

          {/* <ChainHeightButton /> */}
        </div>
      </div>
    </nav>
  );
};

export default Header;
