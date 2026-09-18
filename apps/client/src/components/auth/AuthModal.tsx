import React, { useState } from "react";
import {
  Terminal,
  Lock,
  Mail,
  User,
  Globe,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
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
        err.response?.data?.message ||
        "Authentication failed. Please verify credentials.";
      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => { // for quick demo role logins (e.g Dante[Translator], etc)
    setEmail(quickEmail);
    setPassword("Password123!");
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-surface-canvas p-4 text-gray-200">
      <div className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-panel p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-border-subtle pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-navy border border-accent-gold/40">
            <Terminal className="h-5 w-5 text-accent-gold" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-wider text-accent-gold">
              CAPSLOC // TERMINAL AUTH
            </h1>
            <p className="text-[11px] text-gray-400 font-mono">
              Internal Game Localization Operations
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-4 flex rounded bg-surface-card p-1 text-xs font-mono">
          <button
            type="button"
            className={`flex-1 rounded py-1.5 transition-colors ${
              !isRegister
                ? "bg-brand-navy text-white font-semibold"
                : "text-gray-400 hover:text-white"
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
            className={`flex-1 rounded py-1.5 transition-colors ${
              isRegister
                ? "bg-brand-navy text-white font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
          >
            REGISTER NEW OPERATOR
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="mt-4 flex items-start space-x-2 rounded border border-status-flagged/40 bg-status-flagged/10 p-2.5
  text-xs text-status-flagged"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-400">
                  Username
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="dante_sparda"
                    className="w-full rounded border border-border-subtle bg-surface-card pl-8 pr-3 py-2 text-white
  placeholder-gray-600 focus:border-accent-gold focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-400">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dante (Lead Translator)"
                  className="mt-1 w-full rounded border border-border-subtle bg-surface-card px-3 py-2 text-white placeholder-
  gray-600 focus:border-accent-gold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400">
                    Loc Role
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={locRole}
                      onChange={(e) => setLocRole(e.target.value as LocRole)}
                      className="w-full appearance-none rounded border border-border-subtle bg-surface-card pl-2.5 pr-8 py-2 text-white focus:border-accent-gold focus:outline-none cursor-pointer"
                    >
                      <option value={LocRole.TRANSLATOR}>Translator</option>
                      <option value={LocRole.LQA_TESTER}>LQA Tester</option>
                      <option value={LocRole.SOLUTIONS_DEV}>Solutions Dev</option>
                      <option value={LocRole.LOC_PM}>Loc PM</option>
                      <option value={LocRole.AUDIO_SPECIALIST}>
                        Audio Specialist
                      </option>
                      <option value={LocRole.GENERAL_USER}>General User</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400">
                    Primary Locale
                  </label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-500" />
                    <input
                      type="text"
                      value={primaryLocale}
                      onChange={(e) => setPrimaryLocale(e.target.value)}
                      placeholder="ja-JP"
                      className="w-full rounded border border-border-subtle bg-surface-card pl-7 pr-2 py-2 text-white
  placeholder-gray-600 focus:border-accent-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase text-gray-400">
              Workstation Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dante@capcom.local"
                className="w-full rounded border border-border-subtle bg-surface-card pl-8 pr-3 py-2 text-white placeholder-
  gray-600 focus:border-accent-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-gray-400">
              Security Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded border border-border-subtle bg-surface-card pl-8 pr-3 py-2 text-white placeholder-
  gray-600 focus:border-accent-gold focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center space-x-2 rounded bg-brand-navy hover:bg-brand-navy-light
  py-2 text-xs font-mono font-bold uppercase tracking-wider text-accent-gold border border-accent-gold/40 transition-colors
  disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>
                {isRegister
                  ? "REGISTER & ENTER TERMINAL"
                  : "AUTHENTICATE SESSION"}
              </span>
            )}
          </button>
        </form>

        {/* Quick Demo Login Presets */}
        {!isRegister && (
          <div className="mt-5 border-t border-border-subtle pt-4">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-500">
              Demo Persona Quick-Select (Seeded DB)
            </span>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickLogin("dante@capcom.local")}
                className="rounded border border-border-subtle bg-surface-card px-2 py-1.5 text-gray-300 hover:border-accent-
  gold/50 hover:text-accent-gold transition-colors"
              >
                Dante (Trans)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("jill@capcom.local")}
                className="rounded border border-border-subtle bg-surface-card px-2 py-1.5 text-gray-300 hover:border-accent-
  gold/50 hover:text-accent-gold transition-colors"
              >
                Jill (LQA)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("leon@capcom.local")}
                className="rounded border border-border-subtle bg-surface-card px-2 py-1.5 text-gray-300 hover:border-accent-
  gold/50 hover:text-accent-gold transition-colors"
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
