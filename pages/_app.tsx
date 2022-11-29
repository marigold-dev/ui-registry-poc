import type { AppProps } from "next/app";
import Head from "next/head";
import Router from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { PageContainer } from "../src/components";
import { Footer, Header } from "../src/components/layout";
import AuditorProvider from "../src/context/AuditorContext";
import "../styles/globals.css";

NProgress.configure({ showSpinner: false });

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuditorProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <PageContainer>
        <Component {...pageProps} />
      </PageContainer>
      <Footer />
    </AuditorProvider>
  );
}
