"use client";

import { hasPlatformAuthority } from "@/lib/auth/platform-authority";
import { useState } from "react";
import { TenantSelector, useTenantSelection } from "@/lib/auth/tenant-selector";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getDefaultRedirectForRole,
  UserRole,
} from "@/lib/permissions/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  safePostLoginRedirect,
  tenantAwareAdminFallback,
} from "@/lib/auth/admin-login-routing";
import { tenantFromPath } from "@/lib/auth/tenant-selection";

export default function AdminLoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [tenantId, setTenantId] = useTenantSelection();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const loginResponse = await login({ email, password, tenantId });
      console.log("✅ Login successful, cookies set by server");

      const userRole = loginResponse.user.roleId as UserRole;
      const principal = loginResponse.user;
      const routeTenant = tenantFromPath(pathname);
      const redirectPath = hasPlatformAuthority(principal)
        ? "/editorial-console"
        : tenantAwareAdminFallback(
            getDefaultRedirectForRole(userRole),
            routeTenant,
          );
      const requestedRedirect =
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("redirect");
      const destination = safePostLoginRedirect(
        requestedRedirect,
        redirectPath,
        routeTenant,
      );
      console.log(`↪️  Redirecting ${userRole} to ${destination}`);

      router.push(destination);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#121212] text-white overflow-x-hidden">
      {/* Header */}
      <header className="w-full border-b border-solid border-[#393528] px-6 md:px-20 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-[#f2b90d] size-6">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <h2 className="text-sm md:text-base font-bold tracking-[0.2em] uppercase">
            Access: Security Threshold Protocol
          </h2>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] tracking-widest text-[#bab29c]">
            <ShieldCheck className="text-xs w-4 h-4" />
            ENCRYPTED NODE 042
          </div>
          <div className="h-4 w-[1px] bg-[#393528]"></div>
          <button className="flex items-center justify-center rounded px-4 py-2 bg-[#f2b90d] text-[#121212] text-[10px] font-black tracking-widest uppercase">
            System Status: Standby
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-12">
        {/* Left Side - Headline */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-start px-6 md:px-20 py-12 md:py-24">
          <div className="max-w-2xl mb-12 lg:mb-0">
            {/* Subtitle */}
            <div className="mb-4 flex items-center gap-2">
              <span className="h-[1px] w-12 bg-[#f2b90d]"></span>
              <span className="text-[10px] font-bold tracking-[0.4em] text-[#f2b90d] uppercase">
                Authorization Required
              </span>
            </div>

            {/* Massive Headline */}
            <h1 className="text-white tracking-tighter text-6xl md:text-8xl font-black leading-[0.9] uppercase">
              Access
              <br />
              Protocol
            </h1>

            {/* Description */}
            <div className="mt-12 text-[#bab29c] text-sm max-w-sm font-light leading-relaxed tracking-wide">
              The neural gateway to premium marketing intelligence. Verification
              of structural ID and encrypted key is mandatory for entry.
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-center lg:pl-12 border-l border-transparent lg:border-[#393528] px-6 md:px-20 py-12 md:py-24">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-12">
            <TenantSelector
              value={tenantId}
              onChange={setTenantId}
              disabled={isLoading}
            />
            {/* Email Input */}
            <div className="group">
              <p className="text-[10px] font-bold tracking-[0.3em] text-[#bab29c] uppercase pb-4 group-focus-within:text-[#f2b90d] transition-colors">
                [ Identity ]
              </p>
              <input
                type="email"
                className="hairline-input w-full text-2xl font-light placeholder:text-[#393528] py-4"
                placeholder="Structural ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Input */}
            <div className="group">
              <p className="text-[10px] font-bold tracking-[0.3em] text-[#bab29c] uppercase pb-4 group-focus-within:text-[#f2b90d] transition-colors">
                [ Credential ]
              </p>
              <input
                type="password"
                className="hairline-input w-full text-2xl font-light placeholder:text-[#393528] py-4"
                placeholder="Encrypted Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-900/20 border-red-900"
              >
                <Terminal className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="pt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-sm h-16 bg-[#f2b90d] text-[#121212] text-sm font-black leading-normal tracking-[0.2em] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {isLoading ? "PROCESSING..." : "REQUEST ENTRY"}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              {/* Links */}
              <div className="mt-8 flex justify-between items-center text-[10px] tracking-[0.2em] text-[#544e3b] font-medium uppercase">
                <Link
                  href="/admin/forgot-password"
                  className="hover:text-white transition-colors"
                >
                  Account Recovery
                </Link>
                <span className="h-1 w-1 bg-[#393528] rounded-full"></span>
                <Link href="#" className="hover:text-white transition-colors">
                  System Support
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-20 py-10 border-t border-[#393528] grid grid-cols-12 text-[#544e3b]">
        <div className="col-span-12 lg:col-span-7 flex flex-wrap gap-12 items-end">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">
              Clearance Level
            </p>
            <p className="text-xs font-light text-[#bab29c]">
              LEVEL 07 // INTEL_PRIORITY
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">
              Encryption
            </p>
            <p className="text-xs font-light text-[#bab29c]">
              AES-256-GCM // QUANTUM_RESISTANT
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">
              Architecture
            </p>
            <p className="text-xs font-light text-[#bab29c]">v4.0.2_STABLE</p>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 flex lg:justify-end items-end mt-8 lg:mt-0">
          <p className="text-[9px] font-light tracking-widest text-right">
            © 2024 ACCESS SECURITY THRESHOLD. ALL RIGHTS RESERVED. <br />
            UNAUTHORIZED ENTRY IS LOGGED AND PROSECUTED.
          </p>
        </div>
      </footer>

      {/* Decorative Grid Lines */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-5">
        <div className="h-full w-full grid grid-cols-12">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="border-r border-white/20 h-full"></div>
          ))}
          <div className="h-full"></div>
        </div>
      </div>
    </div>
  );
}
