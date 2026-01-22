"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* =========================
 * Types
 * ========================= */
type Theme = "light" | "dark";

/* =========================
 * Page
 * ========================= */
export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/";

  const { theme, setTheme, mounted } = useTheme();
  const safeTheme: Theme = mounted ? theme : "light";

  // Form
  const [username, setUsername] = useState(""); // login/email/username
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = username.trim().length >= 1 && password.trim().length >= 1;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Login va parol majburiy");
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Login xatolik");
        return;
      }

      router.push(nextUrl); // ✅
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eef2ff] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Background ornaments */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600/15 to-indigo-600/15 blur-3xl" />
        <div className="absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-44 bottom-[-140px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-[140px] h-px w-[92vw] max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-200/70 to-transparent dark:via-slate-800/70" />
      </div>

      {/* Top bar: small NextLine badge + theme */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 pt-4 sm:px-6">
          <NextLineBadge />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(safeTheme === "light" ? "dark" : "light")}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm backdrop-blur hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
              title="Tema"
              aria-label="Tema"
            >
              {safeTheme === "light" ? (
                <IconSun className="h-5 w-5" />
              ) : (
                <IconMoon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Centered Card */}
      <main className="relative z-10 flex min-h-[calc(100vh-84px)] items-center justify-center px-3 pb-10 pt-6 sm:px-6 sm:pt-10">
        <div className="w-full max-w-[520px]">
          <div className="rounded-3xl bg-white/85 shadow-[0_22px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/75 dark:ring-slate-800">
            {/* Card top logo */}
            <div className="px-5 pt-6 sm:px-8 sm:pt-8">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-blue-600/25 to-indigo-600/25 blur-xl" />
                  <div className="relative grid h-16 w-16 place-items-center rounded-[26px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_18px_34px_rgba(37,99,235,0.28)] ring-1 ring-white/15">
                    {/* Tashkilot logosi (o‘zingiznikiga almashtirasiz) */}
                    <OrgLogoMark className="h-8 w-8" />
                  </div>
                </div>
              </div>

              <h1 className="mt-5 text-center text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[28px]">
                Tizimga kirish
              </h1>
              <p className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                Login va parolingizni kiriting. Xavfsizlik uchun
                ma’lumotlaringiz himoyalanadi.
              </p>

              {/* Mini trust row */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Chip
                  icon={<IconShield className="h-4 w-4" />}
                  text="Xavfsiz kirish"
                />
                <Chip
                  icon={<IconBolt className="h-4 w-4" />}
                  text="Tezkor ishlash"
                />
                <Chip
                  icon={<IconLayers className="h-4 w-4" />}
                  text="Moslashuvchan dizayn"
                />
              </div>
            </div>

            <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Login */}
                <Field label="Login yoki email" htmlFor="login">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <IconUser className="h-5 w-5" />
                    </span>
                    <input
                      id="login"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masalan: husenov_abdullo"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-12 pr-4 text-sm outline-none transition
                                 focus:bg-white focus:ring-2 focus:ring-blue-500/30
                                 dark:border-slate-800 dark:bg-slate-950/40 dark:focus:bg-slate-950"
                      autoComplete="username"
                    />
                  </div>
                </Field>

                {/* Password */}
                <Field label="Parol" htmlFor="password">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <IconKey className="h-5 w-5" />
                    </span>

                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-12 pr-12 text-sm outline-none transition
                                 focus:bg-white focus:ring-2 focus:ring-blue-500/30
                                 dark:border-slate-800 dark:bg-slate-950/40 dark:focus:bg-slate-950"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label={
                        showPass ? "Parolni yashirish" : "Parolni ko‘rsatish"
                      }
                      title={showPass ? "Yashirish" : "Ko‘rsatish"}
                    >
                      {showPass ? (
                        <IconEyeOff className="h-5 w-5" />
                      ) : (
                        <IconEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </Field>

                {/* Remember + forgot */}
                <div className="flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 dark:border-slate-700"
                    />
                    Eslab qolish
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
                  >
                    Parolni unutdingizmi?
                  </Link>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className={[
                    "group relative w-full overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
                    "bg-gradient-to-br from-blue-600 to-indigo-600",
                    "shadow-[0_18px_36px_rgba(37,99,235,0.28)]",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  ].join(" ")}
                >
                  <span className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/15 blur-xl transition group-hover:scale-110" />
                  <span className="relative inline-flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Spinner className="h-5 w-5" />
                        Kirilmoqda...
                      </>
                    ) : (
                      <>
                        Kirish
                        <span className="text-white/80">→</span>
                      </>
                    )}
                  </span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <div className="text-xs text-slate-400">yoki</div>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Secondary buttons */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <GhostButton
                    onClick={() =>
                      alert("Google SSO keyin integratsiya qilinadi")
                    }
                    icon={<IconGoogle className="h-5 w-5" />}
                  >
                    Google bilan
                  </GhostButton>
                  <GhostButton
                    onClick={() => alert("SMS/OTP keyin integratsiya qilinadi")}
                    icon={<IconPhone className="h-5 w-5" />}
                  >
                    SMS/OTP bilan
                  </GhostButton>
                </div>

                {/* Register */}
                <div className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                  Akkaunt yo‘qmi?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
                  >
                    Ro‘yxatdan o‘tish
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} NextLine • Barcha huquqlar himoyalangan
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================
 * Theme Hook
 * ========================= */
function useTheme() {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setMounted(true);

    const saved =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      applyTheme(saved);
      return;
    }

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    )?.matches;
    const sys: Theme = prefersDark ? "dark" : "light";
    setThemeState(sys);
    applyTheme(sys);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    applyTheme(next);
  }

  return { theme, setTheme, mounted };
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(t);
}

/* =========================
 * Small UI components
 * ========================= */
function NextLineBadge() {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm ring-1 ring-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:ring-slate-800">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_24px_rgba(37,99,235,0.25)]">
        <span className="text-sm font-black">N</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-tight">
          Next<span className="text-slate-400">Line</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Proyekt ishlab chiquvchi tashkilot
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:ring-slate-800">
      <span className="text-slate-500 dark:text-slate-300">{icon}</span>
      {text}
    </div>
  );
}

function GhostButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {icon}
      {children}
    </button>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={["animate-spin", className].join(" ")}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================
 * Logos / Icons
 * ========================= */
// Tashkilot logosi: o‘zingizning SVG’ingiz bilan almashtiring
function OrgLogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 17V7l10 10V7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 13.2A7.5 7.5 0 0 1 10.8 3 9 9 0 1 0 21 13.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconKey({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 14a5 5 0 1 1 3.9 1.9L9 18H7v-2H5v-2l2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 9h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.6a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.3 6.3C4.1 7.9 2.5 12 2.5 12s3.5 7 9.5 7c2.1 0 4-.8 5.6-1.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.2 5.3A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7s-1.2 2.4-3.3 4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2 20 6v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m12 3 9 6-9 6-9-6 9-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m3 15 9 6 9-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGoogle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21.6 12.2c0-.7-.1-1.2-.2-1.8H12v3.4h5.4c-.1.9-.8 2.2-2.2 3.1v2.3h3.6c2.1-2 2.8-4.8 2.8-8Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.6-2.3c-1 .7-2.2 1.1-3.1 1.1-2.5 0-4.6-1.7-5.4-4h-3.7v2.4A10 10 0 0 0 12 22Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M6.6 14.4c-.2-.6-.4-1.2-.4-1.9s.1-1.3.3-1.9V8.2H2.8A10 10 0 0 0 2 12.5c0 1.6.4 3.1 1.1 4.3l3.5-2.4Z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M12 6.1c1.4 0 2.6.5 3.5 1.4l2.6-2.6C17 3.2 14.7 2 12 2 8.1 2 4.7 4.2 3.1 8.2l3.4 2.4c.8-2.3 2.9-4.5 5.5-4.5Z"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 2h10v20H7V2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 19h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
