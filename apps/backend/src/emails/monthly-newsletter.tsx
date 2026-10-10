import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Heading,
  Column,
  Row,
} from "@react-email/components";
import * as React from "react";
import { siteSettingsData } from "@/lib/site-settings-data";
import { getSocialMediaLinks, getCompanyName, getContactInfo } from "@/lib/server/siteSettings";
import { EmailFooter } from "./components/EmailFooter";

interface MonthlyNewsletterProps {
  headline?: string;
  mainStory?: {
    title: string;
    excerpt: string;
    imageUrl: string;
    ctaText: string;
    ctaLink: string;
  };
  secondaryStories?: {
    title: string;
    excerpt: string;
    ctaText: string;
    ctaLink: string;
  }[];
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

export const MonthlyNewsletterEmail = ({
  headline = 'Aylık Bültenimize Hoş Geldiniz!',
  mainStory = {
    title: "Allplan 2025 Yenilikleri Yayınlandı!",
    excerpt: "En son Allplan sürümü, yapay zeka destekli modelleme, gelişmiş işbirliği araçları ve sürdürülebilirlik analizleri ile projelerinizi bir üst seviyeye taşıyor. Tüm yenilikleri keşfedin.",
    imageUrl: "https://picsum.photos/seed/newsletter-main/600/300",
    ctaText: "Detayları İncele",
    ctaLink: `${baseUrl}/products/allplan`
  },
  secondaryStories = [
    { title: "Webinar: Allplan Bridge ile Parametrik Köprü Tasarımı", excerpt: "Uzmanlarımızdan parametrik tasarımın gücünü öğrenin. Kayıtlar başladı!", ctaText: "Şimdi Kaydol", ctaLink: `${baseUrl}/events` },
    { title: "Yeni Başarı Hikayesi: İstanbul Finans Merkezi", excerpt: "İkonik bir kulenin karmaşık geometrisinin Allplan ile nasıl modellendiğini okuyun.", ctaText: "Hikayeyi Oku", ctaLink: `${baseUrl}/case-studies` },
  ],
  siteSettings,
}: MonthlyNewsletterProps) => {
  // Use dynamic site settings if provided, otherwise fallback to static data
  const companyName = siteSettings?.companyName || getCompanyName();
  const logoUrl = siteSettings?.logoUrl || siteSettingsData.logoUrl || `${baseUrl}/logo.png`;
  const contactInfo = siteSettings?.contact || getContactInfo();
  const socialMediaLinks = siteSettings?.socialMedia || getSocialMediaLinks();
  
  const previewText = `Aluplan Digital'den haberler: ${mainStory.title}`;

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
            <Heading style={heading}>{headline}</Heading>
          </Section>
          
          <Section style={content}>
            <Img
              src={mainStory.imageUrl}
              width="100%"
              style={mainImage}
            />
            <Heading as="h2" style={mainStoryTitle}>{mainStory.title}</Heading>
            <Text style={paragraph}>{mainStory.excerpt}</Text>
            <Button style={button} href={mainStory.ctaLink}>
              {mainStory.ctaText}
            </Button>
          </Section>
          
          <Hr style={hr} />

          <Section style={content}>
             <Row>
                {secondaryStories.map((story, index) => (
                    <Column key={index} style={secondaryStoryColumn}>
                        <Heading as="h3" style={secondaryStoryTitle}>{story.title}</Heading>
                        <Text style={secondaryStoryText}>{story.excerpt}</Text>
                         <Link href={story.ctaLink} style={secondaryStoryLink}>
                          {story.ctaText} &rarr;
                        </Link>
                    </Column>
                ))}
             </Row>
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

export default MonthlyNewsletterEmail;

// Styles
const main = {
  backgroundColor: "#f7f7f7",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: '64px',
  border: '1px solid #e5e5e5',
  borderRadius: '4px',
  maxWidth: '600px',
  overflow: 'hidden'
};

const header = {
    padding: '0 32px',
    marginBottom: '20px',
};

const content = {
    padding: '0 32px',
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: '#333333'
};

const mainImage = {
    borderRadius: '4px',
    marginBottom: '20px',
};

const mainStoryTitle = {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    color: '#333333'
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: '#445354',
  margin: '0 0 20px 0',
};

const button = {
  backgroundColor: "#ED7D31",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: 'bold',
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "30px 0",
};

const secondaryStoryColumn = {
    width: '50%',
    padding: '0 10px',
};

const secondaryStoryTitle = {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#333333'
};

const secondaryStoryText = {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#666666',
    margin: '0 0 12px 0',
};

const secondaryStoryLink = {
    fontSize: '14px',
    color: '#ED7D31',
    textDecoration: 'none',
};
