'use server';

import { analyzeSupportTicket as analyzeTicketFlow } from '@/ai/flows/support-ticket-analysis';
import { z } from 'zod';

const FormSchema = z.object({
  problemDescription: z.string().min(50, 'Lütfen sorununuzu en az 50 karakterle açıklayın.'),
  category: z.string().min(1, 'Lütfen bir kategori seçin.'),
});

export type FormState = {
  step: 1 | 2;
  message: string;
  originalInput?: {
      problemDescription: string;
      category: string;
  };
  data?: {
    summary: string;
    priority: string;
    suggestion: string;
  };
};

export async function analyzeSupportTicket(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {

  const action = formData.get('action');

  if (action === 'back') {
    return {
        step: 1,
        message: '',
        originalInput: prevState.originalInput
    };
  }

  if (action === 'create_ticket') {
    // In a real app, you would save the ticket to the database here.
    // For now, we'll just log it and redirect.
    console.log("Creating ticket with AI analysis:", {
      description: formData.get('problemDescription'),
      category: formData.get('category'),
      summary: formData.get('summary'),
      priority: formData.get('priority'),
    });
    // Normally we would redirect to the new ticket page.
    // redirect(`/portal/support/tkt-new`);
    return { step: 1, message: 'Destek talebiniz başarıyla oluşturuldu!' };
  }


  const validatedFields = FormSchema.safeParse({
    problemDescription: formData.get('problemDescription'),
    category: formData.get('category'),
  });

  if (!validatedFields.success) {
    return {
      step: 1,
      message: validatedFields.error.errors.map(e => e.message).join(', '),
    };
  }

  try {
    const result = await analyzeTicketFlow({
      problemDescription: validatedFields.data.problemDescription,
      category: validatedFields.data.category,
    });

    return {
      step: 2,
      message: 'Analiz başarılı!',
      originalInput: validatedFields.data,
      data: result,
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      step: 1,
      message: 'AI analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}
