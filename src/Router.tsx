import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Error from "./pages/Error";
import ViewPackage, { loadPackage } from "./pages/ViewPackage";

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
    element: <Home />,
  },
  {
    loader: loadPackage,
    path: "package/:packageName",
    element: <ViewPackage />,
  },
]);

export default Router;
