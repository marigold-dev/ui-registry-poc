import { Link } from "react-router-dom";

type Props = {
  title: string;
  subtitle: string;
  message: string;
};

const Error = ({ title, subtitle, message }: Props) => {
  return (
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
  );
};

export default Error;
