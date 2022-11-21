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
        <meta name="description" content="Ligolang packages registry" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
