import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

type Props = {
  title: string;
  subtitle: string;
  message: string;
};

const Error = ({ title, subtitle, message }: Props) => {
  return (
    <>
      <Header />
      <main role="main">
        <section className="section main-content container">
          <section className="hero">
            <div className="hero-body">
              <p className="title has-text-danger">{title}</p>
              <p className="subtitle has-text-danger">{subtitle}</p>
              <article className="message is-danger">
                <div className="message-body">{message}</div>
              </article>
              <Link className="button is-warning is-small" to="/">
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
