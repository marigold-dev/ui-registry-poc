import Head from "next/head";
import Link from "next/link";
import Footer from "../src/components/layout/Footer";
import Header from "../src/components/layout/Header";

const Error = () => {
  return (
    <>
      <Head>
        <title>Ligo Package Registry</title>
      </Head>
      <Header />
      <main role="main">
        <section className="section main-content container">
          <section className="hero">
            <div className="hero-body">
              <p className="title has-text-danger">Page not found</p>
              <article className="message is-danger">
                <div className="message-body">
                  The page you're looking for doesn't exists. If you think it's
                  an issue please send us an email at contact@marigold.dev
                </div>
              </article>
              <Link className="button is-warning is-small" href="/">
                Go to the homepage
              </Link>
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Error;
