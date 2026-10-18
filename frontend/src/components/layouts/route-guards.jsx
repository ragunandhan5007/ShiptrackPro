
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { LoadingState } from "@/components/shared/states";
import { canAccess } from "@/lib/nav";
import { ROLE_HOME } from "@/lib/nav";
import { Lock } from "lucide-react";

export function RequireAuth({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingState label="Authenticating…" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Suspended Profile Lockdown Screen
  if (user.active === false || user.status === "suspended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 mb-4 animate-bounce-subtle">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Account Temporarily Locked</h1>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Your profile has been suspended by the platform Administrator. You are restricted from accessing system data, routes, shipments, or operations.
          </p>
          <div className="mt-5 rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-400 border border-rose-500/20">
            Access Policy: Administrative Lockdown Enforced
          </div>
          <button
            onClick={() => {
              sessionStorage.clear();
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="mt-6 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition"
          >
            Sign Out to Login Page
          </button>
        </div>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  const path = location.pathname;
  if (!canAccess(path, user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <Outlet />;
}

export function RequireGuest() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  if (user) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <Outlet />;
}