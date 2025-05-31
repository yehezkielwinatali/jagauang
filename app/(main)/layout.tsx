import React from "react";
export const metadata = {
  title: "JagaUang",
  icons: {
    icon: "/moneylogo.png",
  },
};
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="container mx-auto my-32">{children}</div>;
};

export default MainLayout;
