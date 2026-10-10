import {
  Body,
  Container,
  Head,
  Html,
  Preview,
} from "@react-email/components";
import * as React from "react";
import { EmailHeader } from "./EmailHeader";
import { EmailFooter } from "./EmailFooter";

export interface EmailTemplateProps {
  preview: string;
  children: React.ReactNode;
  companyName: string;
  logoUrl: string;
  contactInfo: {
    address: string;
    phone: string;
    email: string;
  };
  socialMediaLinks: {
    [key: string]: string;
  };
  showUnsubscribeLink?: boolean;
  unsubscribeToken?: string;
  showTagline?: boolean;
  tagline?: string;
  locale?: 'tr' | 'en';
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

export const EmailTemplate = ({
  preview,
  children,
  companyName,
  logoUrl,
  contactInfo,
  socialMediaLinks,
  showUnsubscribeLink = true,
  unsubscribeToken,
  showTagline = false,
  tagline,
  locale = 'tr',
}: EmailTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader
            companyName={companyName}
            logoUrl={logoUrl}
            baseUrl={baseUrl}
            showTagline={showTagline}
            tagline={tagline}
            locale={locale}
          />

          {children}

          <EmailFooter
            companyName={companyName}
            contactInfo={contactInfo}
            socialMediaLinks={socialMediaLinks}
            baseUrl={baseUrl}
            showUnsubscribeLink={showUnsubscribeLink}
            unsubscribeToken={unsubscribeToken}
            locale={locale}
          />
        </Container>
      </Body>
    </Html>
  );
};

// Shared Styles
export const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

export const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "0",
  borderRadius: "8px",
  maxWidth: "600px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

export const content = {
  padding: "32px",
};

export const title = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 16px",
};

export const paragraph = {
  color: "#525f7f",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export const button = {
  backgroundColor: "#5e6ad2",
  borderRadius: "4px",
  color: "#fff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "40px",
  padding: "0 24px",
  textAlign: "center" as const,
  textDecoration: "none",
};

export const buttonContainer = {
  margin: "24px 0",
};