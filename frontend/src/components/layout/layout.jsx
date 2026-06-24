import { Outlet } from "react-router-dom";
import Navbar from "../common/Navbar";
import { AuthTokenProvider } from "../../auth/useAuthToken";
import { FiInstagram, FiTwitter, FiFacebook } from "react-icons/fi";

export default function Layout() {
  const year = new Date().getFullYear();

  return (
    <AuthTokenProvider>
      <div className="app-wrapper">
        <Navbar />
        <main className="app-main">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="footer-apple mt-auto">
          <div className="mw-footer mx-auto px-3 px-sm-4 px-lg-5 py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              <p className="mb-0 text-muted-2 text-sm">
                Copyright © {year} TapRent Inc. All rights reserved.
              </p>

              <div className="footer-socials">
                <FiTwitter className="footer-social-icon cursor-pointer hover-ink transition-colors" />
                <FiInstagram className="footer-social-icon cursor-pointer hover-ink transition-colors" />
                <FiFacebook className="footer-social-icon cursor-pointer hover-ink transition-colors" />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthTokenProvider>
  );
}
