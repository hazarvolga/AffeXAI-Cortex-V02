export interface InviteValues {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  phone: string;
  city: string;
  country: string;
}

export type InviteField = keyof InviteValues;
export type InviteErrors = Partial<Record<InviteField, string>>;

/** Form order, so the summary and first-error focus follow what the user sees. */
export const INVITE_FIELD_ORDER: readonly InviteField[] = [
  "firstName",
  "lastName",
  "email",
  "roleId",
  "phone",
  "city",
  "country",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_FORBIDDEN = 403;
const HTTP_CONFLICT = 409;

export function validateInvite(values: InviteValues): InviteErrors {
  const errors: InviteErrors = {};
  if (!values.firstName.trim()) errors.firstName = "Ad gerekli.";
  if (!values.lastName.trim()) errors.lastName = "Soyad gerekli.";
  if (!values.email.trim()) errors.email = "E-posta gerekli.";
  else if (!EMAIL_PATTERN.test(values.email.trim()))
    errors.email = "Örneğin ad@kurulus.com gibi geçerli bir e-posta girin.";
  if (!values.roleId) errors.roleId = "Bir rol seçin.";
  return Object.fromEntries(
    INVITE_FIELD_ORDER.filter((f) => errors[f]).map((f) => [f, errors[f]]),
  ) as InviteErrors;
}

export function inviteErrorMessage(status: number | undefined): string {
  if (status === HTTP_CONFLICT)
    return "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.";
  if (status === HTTP_FORBIDDEN) return "Kullanıcı davet etme yetkiniz yok.";
  return "Davet gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.";
}
