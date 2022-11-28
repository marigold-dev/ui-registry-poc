import Head from "next/head";
import Link from "next/link";
import Footer from "../src/components/layout/Footer";
import Header from "../src/components/layout/Header";

const Error = () => {
  return (
    <>
      <Head>
        <title>404 - Ligo Package Registry</title>
      </Head>
      <Header />
      <main role="main" className="prose">
        <p className="text-red-500 text-2xl">Page not found</p>

        <p className="mt-2">
          The page you're looking for doesn't exists. If you think it's an
          issue, please send us an email at contact@marigold.dev
        </p>

        <Link className="button is-warning is-small" href="/">
          Go to the homepage
        </Link>
      </main>
      <Footer />
    </>
  );
};

export default Error;
