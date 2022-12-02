import { ReactNode } from "react";

type props = {
  children: ReactNode;
};
const PageContainer = ({ children }: props) => (
  <div className="w-full flex justify-center pt-20 px-4 md:px-0 mb-40">
    <main className="w-full md:max-w-7xl mt-8">{children}</main>
  </div>
);

export default PageContainer;
