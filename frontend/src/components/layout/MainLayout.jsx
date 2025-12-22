// components/layout/MainLayout.jsx
import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function MainLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />

      <div style={{ display: "flex" }}>
        {isAuthenticated && <Sidebar />}
        <Outlet />
      </div>

      <Footer />
    </>
  );
}
