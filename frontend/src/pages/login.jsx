import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Truck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/shared/logo";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8080/api/auth/login/send-otp",
        {
          email,
          password,
        },
      );

      setOtpSent(true);
      setSuccessMessage(
        response.data.message || "OTP has been sent to your email",
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8080/api/auth/login/verify-otp",
        {
          email,
          otp,
        },
      );


sessionStorage.setItem("refreshToken", response.data.refreshToken);
sessionStorage.setItem("shiptrack.token", response.data.token);


      const roleMap = {
        ADMIN: "admin",
        CUSTOMER: "customer",
        BUSINESS_CLIENT: "business_client",
        LOGISTICS_OPERATOR: "logistics_operator",
        SUPPORT_AGENT: "support_agent",
      };

      

      sessionStorage.setItem(
        "shiptrack.session",
        JSON.stringify({
          user: {
            name: response.data.email,
            email: response.data.email,
            role: roleMap[response.data.role],
          },
          token: response.data.token,
        }),
      );

      if (response.data?.email) {
        localStorage.setItem(`last_active_${response.data.email.toLowerCase()}`, new Date().toISOString());
      }

      await refreshUser();
      const role = response.data.role;

      switch (role) {
        case "ADMIN":
          navigate("/app/admin/dashboard", { replace: true });
          break;
        case "CUSTOMER":
          navigate("/app/customer/dashboard", { replace: true });
          break;
        case "BUSINESS_CLIENT":
          navigate("/app/business_client/dashboard", { replace: true });
          break;
        case "LOGISTICS_OPERATOR":
          navigate("/app/logistics_operator/dashboard", { replace: true });
          break;
        case "SUPPORT_AGENT":
          navigate("/app/support_agent/dashboard", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setForgotError("");
    setForgotSuccess("");

    try {
      setForgotLoading(true);

      const response = await axios.post(
        "http://localhost:8080/api/password/forgot",
        {
          email: forgotEmail,
        },
      );

      setForgotSuccess(
        response.data.message ||
          "Password reset link sent to your registered email.",
      );
    } catch (error) {
      console.error(error);

      setForgotError(error?.response?.data?.message || "User not found");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-950 grid-bg">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-900/90 to-primary/20 border-r border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10">
          <Logo variant="dark" />
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            <Truck className="h-3.5 w-3.5 animate-pulse" />
            Enterprise Logistics Platform
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Real-time tracking and intelligent fleet management.
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Gain end-to-end operational visibility over your global shipments,
            automated ETAs, proof of delivery, and instant dispute resolution.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              Real-time Telemetry
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              Digital POD Verification
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              Role-Based Security
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              Automated Route Optimization
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} ShipTrackPro Inc. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 glass-dark p-8 sm:p-10 rounded-2xl border border-slate-800 shadow-2xl animate-fade-in">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex justify-center lg:hidden mb-4">
              <Logo variant="dark" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {otpSent ? "Security Verification" : "Sign in to ShipTrackPro"}
            </h2>
            <p className="text-xs text-slate-400">
              {otpSent
                ? "Enter the 6-digit OTP code sent to your email address"
                : "Enter your registered credentials to access your portal"}
            </p>
          </div>

          {errorMessage && (
            <div
              className={`flex items-start gap-3 rounded-xl ${
                errorMessage.toLowerCase().includes("locked") || errorMessage.toLowerCase().includes("suspended")
                  ? "bg-rose-500/20 border-2 border-rose-500 p-4 text-rose-200"
                  : "bg-rose-500/10 border border-rose-500/20 p-3.5 text-rose-400"
              } text-xs font-semibold animate-fade-in`}
            >
              {errorMessage.toLowerCase().includes("locked") || errorMessage.toLowerCase().includes("suspended") ? (
                <Lock className="h-5 w-5 shrink-0 text-rose-400 mt-0.5 animate-bounce-subtle" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div>
                {(errorMessage.toLowerCase().includes("locked") || errorMessage.toLowerCase().includes("suspended")) && (
                  <p className="font-extrabold text-sm text-white mb-0.5">🔒 Account Temporarily Locked</p>
                )}
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-11 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotError("");
                    setForgotSuccess("");
                    setForgotPasswordOpen(true);
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 gradient-brand text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  <>
                    Continue to OTP
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Verification OTP Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs font-mono tracking-widest text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  "Verify & Complete Sign In"
                )}
              </button>
            </form>
          )}

          <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800/80">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-7 shadow-2xl animate-fade-in">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setForgotPasswordOpen(false);
                setForgotError("");
                setForgotSuccess("");
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>

            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>

              <h2 className="text-xl font-bold text-white">Forgot Password?</h2>

              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Enter your registered email address and we'll send you a secure
                link to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              {/* Error */}
              {forgotError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Success */}
              {forgotSuccess && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* Email */}
              {!forgotSuccess && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        autoFocus
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              {/* After success */}
              {forgotSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setForgotSuccess("");
                    setForgotError("");
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Back to Login
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
