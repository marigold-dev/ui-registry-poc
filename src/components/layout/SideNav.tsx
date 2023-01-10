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
            ? "bg-ligo-600 text-white hover:bg-ligo-600 hover:text-white"
            : ""
        }`}
      >
        {children}
      </Link>
    </li>
  );
};

type props = {
  title: string;
  links: { href: string; text: string }[];
};

const SideNav = ({ title, links }: props) => (
  <aside className="static lg:fixed top-20 bottom-0 left-0 bg-white w-full lg:w-56 lg:px-4 lg:py-4 lg:drop-shadow z-20 lg:block">
    <section>
      <h3 className="text-2xl text-ligo-600 font-bold">{title}</h3>
      <ul className="space-y-2 mt-2 w-full">
        {links.map(({ href, text }, i) => (
          <NavLink key={i} href={href}>
            {text}
          </NavLink>
        ))}
      </ul>
    </section>
  </aside>
);

export default SideNav;
