import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Mail, ChevronRight } from "lucide-react";
import { usersAPI } from "../api/axiosConfig";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect
  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { token } = await usersAPI.adminLogin(formData);
      localStorage.setItem("admin_token", token);
      toast.success("Admin authenticated successfully.");
      window.location.href = "/admin"; // Force hard redirect to clear out any Clerk states
    } catch (err) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 mx-4 animate-fade-in" style={{ animationDuration: '600ms' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ink text-white mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <Lock className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">Admin Portal</h1>
          <p className="text-ink-muted">Sign in with your system credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5 ml-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field pl-11"
                  placeholder="System username"
                  autoComplete="username"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-subtle" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-11"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  autoComplete="current-password"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-subtle" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3.5 text-base group relative overflow-hidden mt-2"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Secure Login
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
