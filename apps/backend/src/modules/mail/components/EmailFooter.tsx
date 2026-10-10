import {
  Section,
  Text,
  Link,
  Row,
  Column,
  Img,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface EmailFooterProps {
  companyName: string;
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
  baseUrl: string;
  locale?: 'tr' | 'en';
}

export const EmailFooter = ({
  companyName,
  contactInfo,
  socialMediaLinks,
  showUnsubscribeLink = true,
  unsubscribeToken,
  baseUrl,
  locale = 'tr',
}: EmailFooterProps) => {
  const t = {
    unsubscribe: locale === 'tr' ? 'Abonelikten çık' : 'Unsubscribe',
    unsubscribeMessage: locale === 'tr' 
      ? 'Bu e-postayı almak istemiyorsanız, lütfen abonelikten çıkın.' 
      : 'If you don\'t want to receive this email, please unsubscribe.',
    contactSeparator: locale === 'tr' ? ' | ' : ' | ',
    emailLabel: locale === 'tr' ? 'Email: ' : 'Email: ',
    phoneLabel: locale === 'tr' ? 'Telefon: ' : 'Phone: ',
  };

  return (
    <>
      <Hr style={hr} />
      <Section style={footer}>
        {/* Social Media Links */}
        {Object.keys(socialMediaLinks).length > 0 && (
          <Section style={socialContainer}>
            <Row>
              {Object.entries(socialMediaLinks)
                .filter(([_, url]) => url)
                .map(([platform, url]) => (
                  <Column key={platform} align="center" style={socialIconColumn}>
                    <Link href={url as string}>
                      <Img 
                        src={`https://static.cdn.person.io/images/social/${platform.toLowerCase()}-logo-2x.png`} 
                        width="24" 
                        height="24" 
                        alt={platform}
                        style={socialIcon}
                      />
                    </Link>
                  </Column>
                ))}
            </Row>
          </Section>
        )}

        {/* Contact Information */}
        <Text style={footerText}>
          {companyName} - {contactInfo.address}
        </Text>
        <Text style={footerText}>
          {t.emailLabel}
          <Link href={`mailto:${contactInfo.email}`} style={footerLink}>
            {contactInfo.email}
          </Link>
          {t.contactSeparator}
          {t.phoneLabel}
          {contactInfo.phone}
        </Text>

        {/* Unsubscribe Link */}
        {showUnsubscribeLink && (
          <Text style={footerText}>
            <Link
              href={unsubscribeToken
                ? `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
                : `${baseUrl}/preferences`
              }
              style={footerLink}
            >
              {t.unsubscribe}
            </Link>
          </Text>
        )}
      </Section>
    </>
  );
};

// Styles
const hr = {
  borderColor: "#e5e5e5",
  margin: "30px 0",
};

const footer = {
  padding: '0 32px',
  textAlign: 'center' as const,
};

const socialContainer = {
  padding: '0 32px',
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const socialIconColumn = {
  padding: '0 8px',
};

const socialIcon = {
  display: 'block',
};

const footerText = {
  color: "#6a7380",
  fontSize: "12px",
  lineHeight: '18px',
  margin: '4px 0',
};

const footerLink = {
  color: '#6a7380',
  textDecoration: 'underline',
  fontSize: "12px",
};