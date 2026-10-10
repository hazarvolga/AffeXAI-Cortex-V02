'use client';

import { hasPlatformAuthority } from '@/lib/auth/platform-authority';
import { useState } from 'react';
import { TenantSelector, useTenantSelection } from '@/lib/auth/tenant-selector';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useTenantSelection();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 LoginPage: Starting login process');
      const result = await login({ email, password, tenantId });

      toast({
        title: 'Başarılı',
        description: `Giriş başarılı!`,
      });

      const user = result?.user;
      const metadata = user?.metadata;

      // Get role name from multiple possible sources
      const primaryRoleName = user?.primaryRole?.name || user?.roleEntity?.name || '';
      const userRoles = user?.roles || [];

      console.log('🔄 Login successful, checking profile completion and role:', {
        primaryRoleName,
        roles: userRoles.map((r: any) => r.name),
        metadata
      });

      console.log('🔍 DEBUG: Checking Super Admin Role');
      console.log('   - Primary Role:', primaryRoleName);
      console.log('   - User Roles:', userRoles);

      // Platform navigation uses the server-provisioned flag, never an editable role name.
      const isSuperAdmin = hasPlatformAuthority(user);

      if (isSuperAdmin) {
        console.log('✅ Super Admin detected, redirecting to Editorial Console');
        router.push('/editorial-console');
        return;
      }

      // CRITICAL: Staff roles should bypass profile completion entirely
      const staffRoles = ['admin', 'editor', 'content editor', 'marketing manager',
        'social media manager', 'event coordinator', 'support manager',
        'support agent', 'support', 'support team'];

      const hasStaffRole = userRoles.some((role: any) =>
        staffRoles.includes(role.name?.toLowerCase())
      ) || staffRoles.includes(primaryRoleName.toLowerCase());

      // Staff users → Admin Panel (NO profile completion check)
      if (hasStaffRole) {
        console.log('✅ Staff role detected, redirecting to Admin Panel (bypass profile check)');
        router.push('/admin');
        return;
      }

      // CRITICAL: Check if profile completion is required BEFORE portal redirect
      const isCustomer = metadata?.isCustomer;
      const isStudent = metadata?.isStudent;

      // Check if profile is incomplete
      const customerIncomplete = isCustomer && (!metadata?.customerNumber || !metadata?.companyName);
      const studentIncomplete = isStudent && (!metadata?.schoolName || !metadata?.studentId);

      if (customerIncomplete || studentIncomplete) {
        console.log('⚠️ Profile incomplete, redirecting to /complete-profile');
        toast({
          title: 'Profil Tamamlama',
          description: 'Lütfen profil bilgilerinizi tamamlayın',
          variant: 'default',
        });
        router.push('/complete-profile');
        return;
      }

      // Profile is complete, redirect to portal
      console.log('✅ Profile complete, redirecting to User Portal');
      router.push('/portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu');
      toast({
        title: 'Hata',
        description: err.message || 'Giriş yapılırken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#121212] text-white overflow-x-hidden">
      {/* Header */}
      <header className="w-full border-b border-solid border-[#2d3a2d] px-6 md:px-20 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-[#10b981] size-6">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-sm md:text-base font-bold tracking-[0.2em] uppercase">
            Access: User Portal Gateway
          </h2>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] tracking-widest text-[#9ca89c]">
            <ShieldCheck className="text-xs w-4 h-4" />
            SECURE NODE 128
          </div>
          <div className="h-4 w-[1px] bg-[#2d3a2d]"></div>
          <button className="flex items-center justify-center rounded px-4 py-2 bg-[#10b981] text-[#121212] text-[10px] font-black tracking-widest uppercase">
            System Status: Online
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
              <span className="h-[1px] w-12 bg-[#10b981]"></span>
              <span className="text-[10px] font-bold tracking-[0.4em] text-[#10b981] uppercase">
                User Authentication
              </span>
            </div>

            {/* Massive Headline */}
            <h1 className="text-white tracking-tighter text-6xl md:text-8xl font-black leading-[0.9] uppercase">
              Portal<br />Gateway
            </h1>

            {/* Description */}
            <div className="mt-12 text-[#9ca89c] text-sm max-w-sm font-light leading-relaxed tracking-wide">
              Secure access point to customer and student services. Identity verification required for portal entry.
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-center lg:pl-12 border-l border-transparent lg:border-[#2d3a2d] px-6 md:px-20 py-12 md:py-24">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-12">
            <TenantSelector value={tenantId} onChange={setTenantId} disabled={isLoading} />
            {/* Email Input */}
            <div className="group">
              <p className="text-[10px] font-bold tracking-[0.3em] text-[#9ca89c] uppercase pb-4 group-focus-within:text-[#10b981] transition-colors">
                [ Email ]
              </p>
              <input
                type="email"
                className="hairline-input-green w-full text-2xl font-light placeholder:text-[#2d3a2d] py-4"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Input */}
            <div className="group">
              <p className="text-[10px] font-bold tracking-[0.3em] text-[#9ca89c] uppercase pb-4 group-focus-within:text-[#10b981] transition-colors">
                [ Password ]
              </p>
              <input
                type="password"
                className="hairline-input-green w-full text-2xl font-light placeholder:text-[#2d3a2d] py-4"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900">
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
                className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-sm h-16 bg-[#10b981] text-[#121212] text-sm font-black leading-normal tracking-[0.2em] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {isLoading ? 'AUTHENTICATING...' : 'ENTER PORTAL'}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              {/* Links */}
              <div className="mt-8 flex justify-between items-center text-[10px] tracking-[0.2em] text-[#3d4a3d] font-medium uppercase">
                <Link href="/forgot-password" className="hover:text-white transition-colors">
                  Password Recovery
                </Link>
                <span className="h-1 w-1 bg-[#2d3a2d] rounded-full"></span>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-20 py-10 border-t border-[#2d3a2d] grid grid-cols-12 text-[#3d4a3d]">
        <div className="col-span-12 lg:col-span-7 flex flex-wrap gap-12 items-end">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">Access Level</p>
            <p className="text-xs font-light text-[#9ca89c]">STANDARD // USER_PORTAL</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">Security</p>
            <p className="text-xs font-light text-[#9ca89c]">TLS-1.3 // ENCRYPTED_SESSION</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">Version</p>
            <p className="text-xs font-light text-[#9ca89c]">v2.1.0_STABLE</p>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 flex lg:justify-end items-end mt-8 lg:mt-0">
          <p className="text-[9px] font-light tracking-widest text-right">
            AFFEXAI CORTEX. ALL RIGHTS RESERVED. <br />
            SECURE ACCESS MONITORED AND PROTECTED.
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
