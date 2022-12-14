import type { AppProps } from "next/app";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { PageContainer } from "../src/components";
import { Footer, Header, SideNav } from "../src/components/layout";
import AuditorProvider from "../src/context/AuditorContext";
import "../styles/globals.css";

NProgress.configure({ showSpinner: false });

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <AuditorProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />

      {router.pathname !== "/" ? (
        <div className="w-full flex justify-center pt-20 mb-40 lg:pl-56">
          <main className="w-full mt-8 pl-4 lg:pl-8 pr-4">
            {router.pathname.includes("/packages") ||
            router.pathname.includes("/package") ? (
              <SideNav
                title="Packages"
                links={[
                  {
                    href: "/packages",
                    text: "See all",
                  },
                  {
                    href: "/packages/curated",
                    text: "Curated by developers",
                  },
                  {
                    href: "/packages/new-packages",
                    text: "New packages",
                  },
                  {
                    href: "/packages/most-downloaded",
                    text: "Most downloaded",
                  },
                ]}
              />
            ) : (
              <SideNav
                title="Templates"
                links={[
                  {
                    href: "/templates",
                    text: "See all",
                  },
                  {
                    href: "/templates/token",
                    text: "Token",
                  },
                  {
                    href: "/templates/governance",
                    text: "Governance",
                  },
                  {
                    href: "/templates/utilities",
                    text: "Utilities",
                  },
                ]}
              />
            )}
            <Component {...pageProps} />
          </main>
        </div>
      ) : (
        <PageContainer>
          <Component {...pageProps} />
        </PageContainer>
      )}

      <Footer />
    </AuditorProvider>
  );
}
