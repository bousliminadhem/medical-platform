"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { LoginRequest } from "@/types/api";
import {
  Eye,
  EyeOff,
  HeartPulse,
  Copy,
  Check,
  Zap,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

// ─── Default bootstrap credentials from backend ────────────────────────────
const DEFAULT_ADMIN = {
  email: "admin@medical-platform.local",
  password: "ChangeMe!12345",
};

// ─── Validation schema ─────────────────────────────────────────────────────
const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"email" | "password" | "all" | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleCopy = async (text: string, field: "email" | "password" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard error
    }
  };

  const handleAutoFill = () => {
    setValue("email", DEFAULT_ADMIN.email, { shouldValidate: true });
    setValue("password", DEFAULT_ADMIN.password, { shouldValidate: true });
    setCopiedField("all");
    setTimeout(() => setCopiedField(null), 1800);
  };

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values as LoginRequest);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Authentication failed. Please verify your credentials.";
      setServerError(message);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="group relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-soft transition-all duration-300 hover:scale-105">
            <HeartPulse className="h-6 w-6 text-emerald-400" strokeWidth={2.2} />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/90 dark:bg-obsidian-850/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aether Clinical Platform
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Clinic Portal Sign-In
          </h1>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Secure clinical administration and practitioner portal
          </p>
        </div>

        {/* Card */}
        <div className="card relative p-8">
          {/* Default Admin Quick-Fill Banner */}
          <div className="mb-6 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-obsidian-950/80 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                  Default Administrator
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFill}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-obsidian-850 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all hover:bg-zinc-100 dark:hover:bg-obsidian-800"
              >
                {copiedField === "all" ? (
                  <>
                    <Check className="h-3 w-3" /> Auto-filled
                  </>
                ) : (
                  <>Auto-fill</>
                )}
              </button>
            </div>

            <div className="mt-2 space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded-lg bg-white dark:bg-obsidian-900/90 px-2.5 py-1 border border-zinc-200/80 dark:border-white/[0.06] shadow-subtle">
                <span className="text-zinc-500">EMAIL</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-900 dark:text-zinc-200 truncate max-w-[170px]">
                    {DEFAULT_ADMIN.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(DEFAULT_ADMIN.email, "email")}
                    className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition"
                    title="Copy email"
                  >
                    {copiedField === "email" ? (
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white dark:bg-obsidian-900/90 px-2.5 py-1 border border-zinc-200/80 dark:border-white/[0.06] shadow-subtle">
                <span className="text-zinc-500">PASS</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-900 dark:text-zinc-200">
                    {DEFAULT_ADMIN.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(DEFAULT_ADMIN.password, "password")}
                    className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition"
                    title="Copy password"
                  >
                    {copiedField === "password" ? (
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-zinc-500">Required</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input pl-10"
                  placeholder="admin@medical-platform.local"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label flex items-center justify-between">
                <span>Password</span>
                <span className="text-zinc-500">Required</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input pl-10 pr-10"
                  placeholder="••••••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 font-mono text-xs text-red-400"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full group mt-2"
            >
              <span>{isSubmitting ? "Signing In…" : "Sign In to Clinic"}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-200/80 dark:border-white/[0.06] pt-4 font-mono text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              HIPAA & GDPR Compliant
            </span>
            <Link
              href="/register"
              className="text-zinc-400 hover:text-emerald-400 transition"
            >
              Patient Portal →
            </Link>
          </div>
        </div>

        {/* Ambient Footer */}
        <div className="mt-8 text-center font-mono text-[10px] tracking-wider text-zinc-500">
          AETHER MEDICAL OS • AUTHORIZED CLINICAL PERSONNEL ONLY
        </div>
      </div>
    </div>
  );
}
