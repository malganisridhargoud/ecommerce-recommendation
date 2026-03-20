import { useAuth, RedirectToSignIn } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { usersAPI } from "../api/axiosConfig";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [role, setRole] = useState("");

  const adminToken = localStorage.getItem("admin_token");

  useEffect(() => {
    let active = true;
    async function loadRole() {
      // If we have an admin bypass token, skip Clerk role checks
      if (adminToken && allowedRoles.includes("admin")) {
        if (active) {
          setRole("admin");
          setRoleLoaded(true);
        }
        return;
      }

      if (!isSignedIn) {
        if (active) {
          setRole("");
          setRoleLoaded(true);
        }
        return;
      }
      try {
        const me = await usersAPI.me();
        if (active) {
          setRole(me.role || "buyer");
        }
      } catch {
        if (active) {
          setRole("buyer");
        }
      } finally {
        if (active) {
          setRoleLoaded(true);
        }
      }
    }
    setRoleLoaded(false);
    loadRole();
    return () => {
      active = false;
    };
  }, [isSignedIn, adminToken, allowedRoles]);

  if (!isLoaded || (isSignedIn && !roleLoaded)) {
    // Admin bypass loader suppression
    if (adminToken && allowedRoles.includes("admin")) {
      return <Outlet />;
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Admin JWT bypass completely overriding Clerk requirement blocks
  if (adminToken && allowedRoles.includes("admin")) {
    return <Outlet />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/buyer"} replace />;
  }

  return <Outlet />;
}
