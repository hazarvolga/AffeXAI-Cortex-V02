import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Heading,
  Row,
  Column
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getCompanyName, getContactInfo } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface NpsSurveyEmailProps {
  userName?: string;
  surveyLink?: string;
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

export const NpsSurveyEmail = ({
  userName = "Değerli Kullanıcımız",
  surveyLink = `${baseUrl}/survey/nps`,
  siteSettings,
}: NpsSurveyEmailProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || {};
  
  const previewText = "Deneyiminizi bir dakikada değerlendirin.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${baseUrl}${logoUrl}`}
              width="150"
              height="auto"
              alt={companyName}
            />
          </Section>

          <Section style={content}>
            <Heading style={heading}>Geri Bildiriminizle Büyüyoruz</Heading>
            <Text style={paragraph}>
              Merhaba {userName},
            </Text>
            <Text style={paragraph}>
              Size sunduğumuz hizmetin kalitesini artırmak için sürekli çalışıyoruz. Bu süreçte en değerli yol göstericimiz sizsiniz.
            </Text>
            <Text style={paragraph}>
             {companyName}'i bir arkadaşınıza veya meslektaşınıza tavsiye etme olasılığınız nedir? Lütfen aşağıdaki ölçek üzerinden bizi değerlendirin.
            </Text>
            
            <Section style={npsSection}>
                <Row>
                    {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                        <Column key={score} style={npsScoreColumn}>
                             <Link href={`${surveyLink}?score=${score}`} style={npsScoreLink(score)}>
                                {score}
                            </Link>
                        </Column>
                    ))}
                </Row>
                 <Row style={npsLabelRow}>
                    <Column align="left">
                        <Text style={npsLabelText}>Pek Olası Değil</Text>
                    </Column>
                    <Column align="right">
                        <Text style={npsLabelText}>Çok Olası</Text>
                    </Column>
                </Row>
            </Section>
            
            <Text style={paragraphSmall}>
                Bir puana tıklamanız sizi geri bildiriminizin kaydedileceği bir sayfaya yönlendirecektir.
            </Text>
          </Section>

          <EmailFooter
            companyName={companyName}
            contactInfo={contactInfo}
            socialMediaLinks={socialMediaLinks}
            baseUrl={baseUrl}
            showUnsubscribeLink={true}
          />
        </Container>
      </Body>
    </Html>
  );
};

export default NpsSurveyEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: "0 auto",
  padding: "20px 0 48px",
  border: '1px solid #e5e5e5',
  borderRadius: '4px',
  maxWidth: '600px',
  overflow: 'hidden'
};

const header = {
    padding: '0 32px',
    textAlign: 'center' as const,
    marginBottom: '20px',
};

const content = {
    padding: '0 32px',
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333',
  lineHeight: '32px',
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
};

const paragraphSmall = {
    fontSize: '12px',
    textAlign: 'center' as const,
    color: '#6a7380',
    lineHeight: "18px",
};

const npsSection = {
    margin: '40px 0',
};

const npsScoreColumn = {
    width: '9%',
};

const npsScoreLink = (score: number) => {
    let backgroundColor = '#f1f5f9'; // neutral-200
    if (score <= 6) backgroundColor = '#fecaca'; // red-200
    if (score >= 7 && score <= 8) backgroundColor = '#fef08a'; // yellow-200
    if (score >= 9) backgroundColor = '#bbf7d0'; // green-200

    return {
        display: 'block',
        width: '36px',
        height: '36px',
        lineHeight: '36px',
        textAlign: 'center' as const,
        borderRadius: '18px',
        backgroundColor: backgroundColor,
        color: '#1e293b',
        fontWeight: 'bold',
        textDecoration: 'none',
    }
};

const npsLabelRow = {
    marginTop: '8px',
};

const npsLabelText = {
    fontSize: '12px',
    color: '#6a7380',
};