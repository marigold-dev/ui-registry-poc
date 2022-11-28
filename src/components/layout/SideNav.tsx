import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

type navLinkProps = {
  href: string;
  children: ReactNode;
};

const NavLink = ({ href, children }: navLinkProps) => {
  const router = useRouter();

  return (
    <li className="w-full">
      <Link
        href={href}
        className={`block px-2 py-1 hover:bg-slate-100 w-full rounded ${
          router.pathname === href
            ? "bg-ligo text-white hover:bg-ligo hover:text-white"
            : ""
        }`}
      >
        {children}
      </Link>
    </li>
  );
};

const SideNav = () => (
  <aside className="fixed top-20 bottom-0 left-0 bg-white w-56 px-4 py-8 border-r-4 border-slate-100 z-50">
    <section>
      <h3 className="text-2xl text-ligo">Templates</h3>
      <ul className="space-y-2 mt-2 w-full">
        <NavLink href="">See all</NavLink>
        <NavLink href="">Token</NavLink>
        <NavLink href="">Governance</NavLink>
        <NavLink href="">Utilities</NavLink>
      </ul>
    </section>
    <section className="mt-4">
      <h3 className="text-2xl text-ligo">Packages</h3>
      <ul className="mt-2 space-y-2 w-full">
        <NavLink href="/packages">All</NavLink>
        <NavLink href="/packages/curated">Curated by developers</NavLink>
        <NavLink href="/packages/new-packages">New packages</NavLink>
        <NavLink href="/packages/most-downloaded">Most downloaded</NavLink>
      </ul>
    </section>
  </aside>
);

export default SideNav;
