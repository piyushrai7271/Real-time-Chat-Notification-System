import { Routes, Route } from "react-router-dom";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<h2>This is main page</h2>} />
      <Route path="/login" element={<h2>Login Page</h2>} />
      <Route path="*" element={<h2>Page Not Found</h2>} />
    </Routes>
  );
}
