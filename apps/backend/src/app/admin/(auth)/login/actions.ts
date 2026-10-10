'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

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
    
    // TODO: Gerçek kimlik doğrulama mantığını burada uygulayın (örneğin Firebase Auth, NextAuth.js)
    console.log('Giriş denemesi:', validatedFields.data);

    // For demo purposes, we'll redirect to the admin dashboard
    // In a real application, you would verify credentials first
    redirect('/admin');
}