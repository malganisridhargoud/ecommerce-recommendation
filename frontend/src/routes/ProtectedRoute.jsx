import { useAuth, RedirectToSignIn } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { usersAPI } from "../api/axiosConfig";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [role, setRole] = useState("");


  useEffect(() => {
    let active = true;
    async function loadRole() {
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
  }, [isSignedIn, allowedRoles]);

  if (!isLoaded || (isSignedIn && !roleLoaded)) {

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ width: 32, height: 32, border: "2px solid var(--border2)", borderTopColor: "var(--ink)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={role === "vendor" ? "/vendor" : "/buyer"} replace />;
  }

  return <Outlet />;
}
