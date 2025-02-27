
import { ReactNode } from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps = {}) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-2 py-4 max-w-6xl">
        <Navbar />
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default Layout;
