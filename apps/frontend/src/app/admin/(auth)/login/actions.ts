'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Get backend API URL - use env variable for production support
function getBackendUrl(): string {
  // NEXT_PUBLIC_API_URL includes /api suffix, so we use it directly
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';
}

const LoginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
});

export type LoginState = {
  message: string;
  issues?: string[];
  fields?: Record<string, string>;
};

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
    const validatedFields = LoginSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            message: 'Form doğrulama hatası.',
            issues: validatedFields.error.flatten().fieldErrors.email,
        };
    }

    try {
        console.log('Giriş denemesi:', validatedFields.data);

        // Call backend API for authentication
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: validatedFields.data.email,
                password: validatedFields.data.password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Giriş başarısız' }));
            return {
                message: errorData.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.',
            };
        }

        const data = await response.json();

        if (!data.access_token) {
            return {
                message: 'Giriş başarısız. Token alınamadı.',
            };
        }

        console.log('✅ Login başarılı, token alındı');

        // Set cookies for authentication
        const cookieStore = await cookies();
        cookieStore.set('auth_token', data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        cookieStore.set('aluplan_access_token', data.access_token, {
            httpOnly: false, // Allow client-side access
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        if (data.refresh_token) {
            cookieStore.set('aluplan_refresh_token', data.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            });
        }

        console.log('✅ Cookies set, redirecting to /admin');

    } catch (error) {
        console.error('❌ Login error:', error);
        return {
            message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        };
    }

    // Redirect to admin dashboard
    redirect('/admin');
}