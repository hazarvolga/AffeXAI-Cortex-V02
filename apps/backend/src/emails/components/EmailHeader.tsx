import {
  Section,
  Img,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";

interface EmailHeaderProps {
  companyName: string;
  logoUrl: string;
  baseUrl: string;
  showTagline?: boolean;
  tagline?: string;
  locale?: 'tr' | 'en';
}

export const EmailHeader = ({
  companyName,
  logoUrl,
  baseUrl,
  showTagline = false,
  tagline,
  locale = 'tr',
}: EmailHeaderProps) => {
  const defaultTagline = locale === 'tr'
    ? 'Dijital dönüşümünüzde yanınızdayız'
    : 'Your partner in digital transformation';

  return (
    <Section style={header}>
      <Link href={baseUrl} style={logoLink}>
        <Img
          src={logoUrl}
          width="150"
          height="auto"
          alt={companyName}
          style={logo}
        />
      </Link>
      {showTagline && (
        <Text style={taglineStyle}>
          {tagline || defaultTagline}
        </Text>
      )}
    </Section>
  );
};

// Styles
const header = {
  padding: '32px 32px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e5e5e5',
};

const logoLink = {
  display: 'inline-block',
};

const logo = {
  display: 'block',
  margin: '0 auto',
};

const taglineStyle = {
  color: '#6a7380',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0 0',
  textAlign: 'center' as const,
};