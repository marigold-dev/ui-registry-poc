import { createBrowserRouter } from "react-router-dom";
import Root from "./components/layout/Root";
import { Home, Error, Package, Packages } from "./pages";

const Router = createBrowserRouter([
  {
    path: "/",
    errorElement: (
      <Error
        title="Error 404"
        subtitle="The page does not exist"
        message="Unable to find the requested page, if the problem persists, try contacting the administrators."
      />
    ),
    element: <Root />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "packages",
        element: <Packages />,
      },
      {
        path: "packages/*",
        element: <Package />,
      },
    ],
  },
]);

export default Router;
