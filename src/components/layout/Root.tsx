import Footer from "./Footer";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const Root = () => {
  return (
    <>
      <Header />
      <main role="main">
        <section className="section main-content container">
          <Outlet />
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Root;
