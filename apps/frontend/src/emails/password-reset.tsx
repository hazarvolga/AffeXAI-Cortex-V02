import {
  Button,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { getCompanyName, getContactInfo, getSocialMediaLinks, getLogoUrl } from "@/lib/server/siteSettings";
import {
  EmailTemplate,
  content,
  title,
  paragraph,
  button,
  buttonContainer
} from "./components/EmailTemplate";

interface PasswordResetEmailProps {
  userName?: string;
  resetLink?: string;
  // Add site settings as props for server-side rendering
  siteSettings?: {
    companyName: string;
    logoUrl: string;
    contact: {
      address: string;
      phone: string;
      email: string;
    };
    socialMedia: {
      [key: string]: string;
    };
  };
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

export const PasswordResetEmail = ({
  userName = 'Değerli Kullanıcı',
  resetLink = `${baseUrl}/portal/login`,
  siteSettings,
}: PasswordResetEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || getLogoUrl();
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || getSocialMediaLinks();

  const previewText = `Şifrenizi sıfırlayın - ${companyName}`;

  return (
    <EmailTemplate
      preview={previewText}
      companyName={companyName}
      logoUrl={logoUrl}
      contactInfo={contactInfo}
      socialMediaLinks={socialMediaLinks}
      showUnsubscribeLink={false}
      showTagline={false}
    >
      <Section style={content}>
        <Text style={title}>
          Şifre Sıfırlama Talebi
        </Text>
        <Text style={paragraph}>
          Merhaba {userName},
        </Text>
        <Text style={paragraph}>
          Hesabınız için bir şifre sıfırlama talebinde bulunuldu. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
        </Text>
        <Text style={paragraph}>
          Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bu link 1 saat içinde geçerliliğini yitirecektir.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={resetLink}>
            Şifremi Sıfırla
          </Button>
        </Section>
        <Text style={paragraph}>
          Veya aşağıdaki linki tarayıcınıza kopyalayın:
          <br />
          <span style={{ fontSize: "12px", color: "#6a7380" }}>
            {resetLink}
          </span>
        </Text>
        <Text style={paragraph}>
          Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi ve güçlü bir şifre kullanmanızı öneririz.
        </Text>
        <Text style={paragraph}>
          İyi günler dileriz,
          <br />
          {companyName} Güvenlik Ekibi
        </Text>
      </Section>
    </EmailTemplate>
  );
};

export default PasswordResetEmail;