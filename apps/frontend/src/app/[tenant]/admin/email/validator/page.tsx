"use client";

import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { EmailModuleNav } from "@/components/admin/email/EmailModuleNav";
import { AddressValidator } from "@/modules/email-marketing/components/address-validator/AddressValidator";

export default function EmailValidatorPage() {
  return (
    <BccEditorialWrapper
      headerTitle="Adres doğrulama"
      headerSubtitle="Bir e-posta adresinin biçimini, alan adını ve teslim edilebilirliğini kontrol edin."
      headerBadge="E-posta"
      moduleNav={<EmailModuleNav />}
    >
      <AddressValidator />
    </BccEditorialWrapper>
  );
}
