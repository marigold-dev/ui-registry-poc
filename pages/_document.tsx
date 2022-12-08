import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/hamburgers/1.2.1/hamburgers.min.css"
          integrity="sha512-+mlclc5Q/eHs49oIOCxnnENudJWuNqX5AogCiqRBgKnpoplPzETg2fkgBFVC6WYUVxYYljuxPNG8RE7yBy1K+g=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <meta charSet="utf-8" />
        <link rel="icon" href="/logo.svg" />
        <meta name="theme-color" content="#000000" />
        <meta property="og:title" content="Package registry" />
        <meta property="og:site_name" content="LIGO" />
        <meta property="og:url" content="https://packages.ligolang.org" />
        <meta
          property="og:description"
          content="The LIGO registry is used to host LIGO packages and contains the contracts/libraries. The packages which reside on the LIGO registry can be installed using the ligo install command."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://packages.ligolang.org/ligo-registry.og.jpg"
        />
        <meta
          name="description"
          content="The LIGO registry is used to host LIGO packages and contains the contracts/libraries along with their metadata. The packages which reside on the LIGO registry can be installed using the ligo install command."
        />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@LigoLang" />
        <meta
          name="twitter:description"
          content="The LIGO registry is used to host LIGO packages and contains the contracts/libraries. The packages which reside on the LIGO registry can be installed using the ligo install command."
        />
        <meta name="twitter:title" content="LIGO Package registry" />
        <meta
          name="twitter:image"
          content="https://packages.ligolang.org/ligo-registry.tw.jpg"
        />
        <meta name="twitter:image:alt" content="LIGOLang logo" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
