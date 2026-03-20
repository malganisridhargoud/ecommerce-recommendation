// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import Layout from "./components/layout/layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/Home";
import EquipmentDetail from "./pages/EquipmentDetail";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import BuyerDashboard from "./pages/BuyerDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PricingPage from "./pages/PricingPage";
import BlogPostPage from "./pages/BlogPostPage";
import RoleAuth from "./pages/RoleAuth";
import NotFound from "./pages/NotFound";
import { AppPreferencesProvider } from "./context/AppPreferencesContext";

const clerkPub = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder";

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPub}>
      <AppPreferencesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/equipment" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/buyer" element={<RoleAuth role="buyer" />} />
              <Route path="/login/vendor" element={<RoleAuth role="vendor" />} />
              <Route path="/login/admin" element={<AdminLogin />} />
              <Route path="/equipment/:id" element={<EquipmentDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/blog/booking-conflict-detection" element={<BlogPostPage />} />

              <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
                <Route path="/dashboard" element={<BuyerDashboard />} />
                <Route path="/buyer" element={<BuyerDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
                <Route path="/vendor" element={<VendorDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #1e293b",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#0f172a" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#0f172a" } },
            }}
          />
        </BrowserRouter>
      </AppPreferencesProvider>
    </ClerkProvider>
  );
}
