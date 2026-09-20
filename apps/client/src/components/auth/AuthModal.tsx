import React, { useState } from "react";
import { Terminal, Lock, Mail, User, Globe, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { LocRole } from "@capsloc/types";
import { useAuth } from "../../hooks/useAuth";

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false); // flag to indicate Registration submission
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [locRole, setLocRole] = useState<LocRole>(LocRole.TRANSLATOR);
  const [primaryLocale, setPrimaryLocale] = useState("ja-JP");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true); // Indicates form is being submitted

    try {
      if (isRegister) {
        await register({
          username,
          email,
          password,
          displayName,
          locRole,
          primaryLocale,
        });
      } else {
        await login({ email, password });
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Authentication failed. Please verify credentials.";
      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    // for quick demo role logins (e.g Dante[Translator], etc)
    setEmail(quickEmail);
    setPassword("Password123!");
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-surface-canvas p-4 text-slate-200">
      <div className="animate-in zoom-in-95 w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-panel/95 p-7 shadow-2xl shadow-black/80 backdrop-blur-xl duration-150">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-white/[0.08] pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-gold/40 bg-brand-navy shadow-inner">
            <Terminal className="h-5 w-5 text-accent-gold" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-wider text-accent-gold">
              CapsLoc Studio
            </h1>
            <p className="font-mono text-[11px] text-slate-400">
              Internal Game Localization Operations
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-5 flex rounded-xl border border-white/[0.06] bg-surface-card/80 p-1 font-mono text-xs">
          <button
            type="button"
            className={`flex-1 rounded-lg border py-1.5 transition-colors duration-150 ${
              !isRegister
                ? "border-white/[0.08] bg-surface-hover font-semibold text-white shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
          >
            SIGN IN
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg border py-1.5 transition-colors duration-150 ${
              isRegister
                ? "border-white/[0.08] bg-surface-hover font-semibold text-white shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
          >
            REGISTER NEW MEMBER
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-start space-x-2 rounded-xl border border-status-flagged/40 bg-status-flagged/10 p-3 text-xs text-status-flagged">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="mb-1.5 block font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="dante_sparda"
                    className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-3 pl-8 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dante (Lead Translator)"
                  className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 px-3 py-2 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                    Loc Role
                  </label>
                  <div className="relative">
                    <select
                      value={locRole}
                      onChange={(e) => setLocRole(e.target.value as LocRole)}
                      className="focus:bg-surface-elevated w-full cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-8 pl-2.5 text-white transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
                    >
                      <option value={LocRole.TRANSLATOR}>Translator</option>
                      <option value={LocRole.LQA_TESTER}>LQA Tester</option>
                      <option value={LocRole.SOLUTIONS_DEV}>Solutions Dev</option>
                      <option value={LocRole.LOC_PM}>Loc PM</option>
                      <option value={LocRole.AUDIO_SPECIALIST}>Audio Specialist</option>
                      <option value={LocRole.GENERAL_USER}>General User</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                    Primary Locale
                  </label>
                  <div className="relative">
                    <Globe className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={primaryLocale}
                      onChange={(e) => setPrimaryLocale(e.target.value)}
                      placeholder="ja-JP"
                      className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-2 pl-8 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
              Workstation Email
            </label>
            <div className="relative">
              <Mail className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dante@capcom.local"
                className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-3 pl-8 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-3 pl-8 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center space-x-2 rounded-lg border border-accent-gold/50 bg-accent-gold/10 py-2.5 font-mono text-xs font-bold tracking-wider text-accent-gold uppercase shadow-sm shadow-accent-gold/10 transition-all duration-150 hover:bg-accent-gold hover:text-surface-canvas active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>{isRegister ? "REGISTER & ENTER" : "SIGN IN"}</span>
            )}
          </button>
        </form>

        {/* Quick Demo Login Presets */}
        {!isRegister && (
          <div className="mt-6 border-t border-white/[0.08] pt-4">
            <span className="block font-mono text-[10px] tracking-wider text-slate-400 uppercase">
              Demo User Quick-Select (Seeded User Roles)
            </span>
            <div className="mt-2.5 grid grid-cols-3 gap-2 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin("dante@capcom.local")}
                className="rounded-lg border border-white/[0.08] bg-surface-card/60 px-2 py-2 text-slate-300 transition-all hover:border-accent-gold/40 hover:bg-white/[0.04] hover:text-accent-gold active:scale-[0.98]"
              >
                Dante (Trans)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("jill@capcom.local")}
                className="rounded-lg border border-white/[0.08] bg-surface-card/60 px-2 py-2 text-slate-300 transition-all hover:border-accent-gold/40 hover:bg-white/[0.04] hover:text-accent-gold active:scale-[0.98]"
              >
                Jill (LQA)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("leon@capcom.local")}
                className="rounded-lg border border-white/[0.08] bg-surface-card/60 px-2 py-2 text-slate-300 transition-all hover:border-accent-gold/40 hover:bg-white/[0.04] hover:text-accent-gold active:scale-[0.98]"
              >
                Leon (Dev)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
