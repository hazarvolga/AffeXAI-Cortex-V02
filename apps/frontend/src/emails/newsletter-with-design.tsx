import { Text, Section, Button, Heading, Hr, Link, Row, Column, Img } from "@react-email/components";
import * as React from "react";
import { EmailTemplateWithDesign, EmailCard } from "./components/EmailTemplateWithDesignSystem";
import { getEmailTemplateData, getEmailStyles, formatDate } from "./helpers/email-template-helper";

export interface ArticleItem {
  title: string;
  description: string;
  image?: string;
  link: string;
  category?: string;
  readTime?: string;
}

export interface NewsletterEmailProps {
  subscriberName?: string;
  subscriberEmail: string;
  newsletterTitle: string;
  newsletterDate: Date | string;
  introText: string;
  featuredArticle: ArticleItem;
  articles: ArticleItem[];
  tips?: string[];
  unsubscribeToken?: string;
  locale?: 'tr' | 'en';
}

export const NewsletterWithDesign = async ({
  subscriberName,
  subscriberEmail,
  newsletterTitle,
  newsletterDate,
  introText,
  featuredArticle,
  articles,
  tips = [],
  unsubscribeToken,
  locale = 'tr',
}: NewsletterEmailProps) => {
  // Get template data with design system
  const templateData = await getEmailTemplateData({
    preview: newsletterTitle,
    subject: `${newsletterTitle} - ${formatDate(newsletterDate, locale)}`,
    theme: 'light',
    context: 'public',
    showUnsubscribeLink: true, // Marketing email
    unsubscribeToken,
    locale,
  });

  const { designSystem } = templateData;
  const styles = getEmailStyles(designSystem);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";

  // Translations
  const t = {
    hello: locale === 'tr' ? "Merhaba" : "Hello",
    featuredStory: locale === 'tr' ? "Öne Çıkan Haber" : "Featured Story",
    readMore: locale === 'tr' ? "Devamını Oku" : "Read More",
    moreStories: locale === 'tr' ? "Diğer Haberler" : "More Stories",
    quickTips: locale === 'tr' ? "Hızlı İpuçları" : "Quick Tips",
    category: locale === 'tr' ? "Kategori" : "Category",
    readTime: locale === 'tr' ? "Okuma Süresi" : "Read Time",
    minutes: locale === 'tr' ? "dakika" : "minutes",
    viewAll: locale === 'tr' ? "Tümünü Görüntüle" : "View All",
    followUs: locale === 'tr' ? "Bizi Takip Edin" : "Follow Us",
    forwardEmail: locale === 'tr' ? "Bu e-postayı bir arkadaşınıza iletin" : "Forward this email to a friend",
    shareNewsletter: locale === 'tr'
      ? "Bu bülteni beğendiyseniz, arkadaşlarınızla paylaşın!"
      : "If you enjoyed this newsletter, share it with your friends!",
    thankYou: locale === 'tr'
      ? "Bizi takip ettiğiniz için teşekkürler!"
      : "Thank you for following us!",
    updatePreferences: locale === 'tr' ? "Tercihlerimi Güncelle" : "Update Preferences",
    viewInBrowser: locale === 'tr' ? "Tarayıcıda Görüntüle" : "View in Browser",
  };

  return (
    <EmailTemplateWithDesign {...templateData}>
      {/* Newsletter Header */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ ...styles.small, ...styles.textMuted, margin: 0 }}>
          {formatDate(newsletterDate, locale)}
        </Text>
        <Heading as="h1" style={{ ...styles.h1, fontSize: '32px', marginTop: '8px' }}>
          📰 {newsletterTitle}
        </Heading>
      </Section>

      {/* Greeting */}
      <Text style={styles.p}>
        {t.hello} {subscriberName || subscriberEmail.split('@')[0]},
      </Text>

      {/* Introduction */}
      <Text style={{ ...styles.p, fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
        {introText}
      </Text>

      {/* Featured Article */}
      <Section style={{ marginBottom: '40px' }}>
        <Heading as="h2" style={{ ...styles.h2, borderBottom: `3px solid ${designSystem.colors.primary}`, paddingBottom: '8px' }}>
          ⭐ {t.featuredStory}
        </Heading>

        <EmailCard designSystem={designSystem}>
          {featuredArticle.image && (
            <Img
              src={featuredArticle.image}
              width="100%"
              height="300"
              alt={featuredArticle.title}
              style={{
                borderRadius: designSystem.radius.default,
                marginBottom: '16px',
                objectFit: 'cover' as const,
              }}
            />
          )}

          <Heading as="h3" style={{ ...styles.h2, fontSize: '24px', marginTop: 0 }}>
            {featuredArticle.title}
          </Heading>

          {(featuredArticle.category || featuredArticle.readTime) && (
            <Text style={{ ...styles.small, ...styles.textMuted, marginBottom: '12px' }}>
              {featuredArticle.category && (
                <span style={{ marginRight: '16px' }}>
                  🏷️ {featuredArticle.category}
                </span>
              )}
              {featuredArticle.readTime && (
                <span>⏱️ {featuredArticle.readTime}</span>
              )}
            </Text>
          )}

          <Text style={{ ...styles.p, lineHeight: '1.6', marginBottom: '20px' }}>
            {featuredArticle.description}
          </Text>

          <Button
            href={featuredArticle.link}
            style={{
              ...styles.button.primary,
              padding: '12px 32px',
            }}
          >
            {t.readMore} →
          </Button>
        </EmailCard>
      </Section>

      {/* More Articles */}
      {articles.length > 0 && (
        <Section style={{ marginBottom: '40px' }}>
          <Heading as="h2" style={styles.h2}>
            📚 {t.moreStories}
          </Heading>

          {articles.map((article, index) => (
            <EmailCard key={index} designSystem={designSystem}>
              <Row>
                {article.image && (
                  <Column width="120">
                    <Img
                      src={article.image}
                      width="100"
                      height="100"
                      alt={article.title}
                      style={{
                        borderRadius: designSystem.radius.default,
                        objectFit: 'cover' as const,
                      }}
                    />
                  </Column>
                )}
                <Column>
                  <Heading as="h4" style={{ ...styles.h3, marginTop: 0, marginBottom: '8px' }}>
                    <Link href={article.link} style={{ ...styles.link, textDecoration: 'none' }}>
                      {article.title}
                    </Link>
                  </Heading>

                  {(article.category || article.readTime) && (
                    <Text style={{ ...styles.small, ...styles.textMuted, marginBottom: '8px' }}>
                      {article.category && (
                        <span style={{ marginRight: '12px' }}>{article.category}</span>
                      )}
                      {article.readTime && <span>{article.readTime}</span>}
                    </Text>
                  )}

                  <Text style={{ ...styles.p, margin: 0, lineHeight: '1.5' }}>
                    {article.description}
                  </Text>

                  <Link
                    href={article.link}
                    style={{
                      ...styles.link,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      marginTop: '8px',
                    }}
                  >
                    {t.readMore} →
                  </Link>
                </Column>
              </Row>
            </EmailCard>
          ))}

          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button
              href={`${baseUrl}/blog`}
              style={{
                ...styles.button.secondary,
                padding: '12px 32px',
              }}
            >
              {t.viewAll}
            </Button>
          </Section>
        </Section>
      )}

      {/* Quick Tips */}
      {tips.length > 0 && (
        <Section style={{
          backgroundColor: designSystem.colors.muted,
          padding: '24px',
          borderRadius: designSystem.radius.md,
          marginBottom: '40px',
        }}>
          <Heading as="h3" style={{ ...styles.h3, marginTop: 0 }}>
            💡 {t.quickTips}
          </Heading>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {tips.map((tip, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <Text style={{ ...styles.p, margin: 0 }}>{tip}</Text>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Hr style={styles.hr} />

      {/* Share Section */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ ...styles.p, fontWeight: 'bold' }}>
          {t.shareNewsletter}
        </Text>
        <Link
          href={`mailto:?subject=${newsletterTitle}&body=${encodeURIComponent(`${baseUrl}/newsletter`)}`}
          style={{
            ...styles.button.outline,
            display: 'inline-block',
            padding: '10px 24px',
            marginTop: '12px',
            border: `2px solid ${designSystem.colors.primary}`,
            borderRadius: designSystem.radius.default,
            textDecoration: 'none',
          }}
        >
          ✉️ {t.forwardEmail}
        </Link>
      </Section>

      {/* Footer Actions */}
      <Section style={{ textAlign: 'center' }}>
        <Link
          href={`${baseUrl}/preferences`}
          style={{
            ...styles.link,
            marginRight: '24px',
            fontSize: '14px',
          }}
        >
          {t.updatePreferences}
        </Link>
        <Link
          href={`${baseUrl}/newsletter/view/${newsletterDate}`}
          style={{
            ...styles.link,
            fontSize: '14px',
          }}
        >
          {t.viewInBrowser}
        </Link>
      </Section>

      {/* Thank You */}
      <Section style={{ marginTop: '32px', textAlign: 'center' }}>
        <Text style={{ ...styles.p, fontSize: '16px', fontWeight: 'bold' }}>
          {t.thankYou}
        </Text>
        <Text style={{ ...styles.small, ...styles.textMuted }}>
          {templateData.companyName} Editorial Team
        </Text>
      </Section>
    </EmailTemplateWithDesign>
  );
};

// Default export for testing
export default NewsletterWithDesign;