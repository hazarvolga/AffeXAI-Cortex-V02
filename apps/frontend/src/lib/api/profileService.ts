import { httpClient } from './http-client';

export interface CustomerData {
  customerNumber?: string;
  companyName?: string;
  taxNumber?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
}

export interface StudentData {
  schoolName?: string;
  studentId?: string;
}

export interface NewsletterPreferences {
  email?: boolean;
  productUpdates?: boolean;
  eventUpdates?: boolean;
}

export interface CompleteProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  customerData?: CustomerData;
  studentData?: StudentData;
  newsletterPreferences?: NewsletterPreferences;
  metadata?: Record<string, any>;
}

export const completeProfile = async (data: CompleteProfileDto) => {
  const response = await httpClient.patch('/users/complete-profile', data);
  return response;
};
