
'use server';

import { z } from 'zod';

const SignupSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır.'),
});

export type SignupState = {
  message: string;
  issues?: string[];
  fields?: Record<string, string>;
};

export async function signup(prevState: SignupState, formData: FormData): Promise<SignupState> {
    const validatedFields = SignupSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            message: 'Form doğrulama hatası.',
            issues: validatedFields.error.flatten().fieldErrors.name || validatedFields.error.flatten().fieldErrors.email || validatedFields.error.flatten().fieldErrors.password,
        };
    }
    
    // TODO: Gerçek kullanıcı kayıt mantığını burada uygulayın (örneğin Firebase Auth)
    console.log('Kayıt denemesi:', validatedFields.data);

    // Başarılı kayıt varsayımı
    return { message: 'Kayıt başarılı! Lütfen giriş yapın.' };
}
