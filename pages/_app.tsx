import type { AppProps } from "next/app";
import Head from "next/head";
import { PageContainer } from "../src/components";
import Header from "../src/components/layout/Header";
import Footer from "../src/components/layout/Header";
import AuditorProvider from "../src/context/AuditorContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuditorProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ligolang package registry</title>
      </Head>
      <Header />
      <PageContainer>
        <Component {...pageProps} />
      </PageContainer>
      <Footer />
    </AuditorProvider>
  );
}
