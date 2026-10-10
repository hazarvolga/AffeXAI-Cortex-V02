/**
 * Email Provider DNS Configuration
 *
 * Contains DNS record requirements for each email service provider
 */

export interface DNSRecord {
  type: 'TXT' | 'CNAME' | 'MX';
  name: string;
  value: string;
  priority?: number;
  note?: string;
  isDynamic?: boolean; // Value comes from provider dashboard
}

export interface EmailProviderDNS {
  provider: string;
  displayName: string;
  description: string;
  docsUrl: string;
  dashboardUrl?: string;
  records: {
    spf?: DNSRecord;
    dkim?: DNSRecord;
    dmarc?: DNSRecord;
    custom?: DNSRecord[];
  };
  steps: string[];
}

export const EMAIL_DNS_CONFIGURATIONS: Record<string, EmailProviderDNS> = {
  resend: {
    provider: 'resend',
    displayName: 'Resend',
    description: 'Modern email API for developers',
    docsUrl: 'https://resend.com/docs/dashboard/domains/introduction',
    dashboardUrl: 'https://resend.com/domains',
    records: {
      spf: {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:_spf.resend.com ~all',
        note: 'Domain root veya subdomain için',
      },
      dkim: {
        type: 'TXT',
        name: 'resend._domainkey',
        value: '(Resend dashboard\'dan alınacak)',
        isDynamic: true,
        note: 'Resend Domains → Domain seç → DNS Records bölümünden al',
      },
      dmarc: {
        type: 'TXT',
        name: '_dmarc',
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@{domain}',
        note: '{domain} yerine kendi domain\'inizi yazın',
      },
    },
    steps: [
      'Resend hesabına giriş yapın',
      'Domains bölümüne gidin ve domain\'inizi ekleyin',
      'DKIM değerini kopyalayın',
      'Domain sağlayıcınıza (GoDaddy, Cloudflare, vs.) giriş yapın',
      'DNS yönetim paneline gidin',
      'Yukarıdaki 3 TXT kaydını ekleyin',
      'DNS değişikliklerinin yayılmasını bekleyin (5-60 dakika)',
      'Resend\'de "Verify DNS Records" butonuna tıklayın',
    ],
  },

  sendgrid: {
    provider: 'sendgrid',
    displayName: 'SendGrid',
    description: 'Twilio SendGrid email delivery platform',
    docsUrl: 'https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication',
    dashboardUrl: 'https://app.sendgrid.com/settings/sender_auth',
    records: {
      spf: {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:sendgrid.net ~all',
      },
      dkim: {
        type: 'CNAME',
        name: 's1._domainkey',
        value: '(SendGrid dashboard\'dan alınacak)',
        isDynamic: true,
        note: 'Sender Authentication → Domain Authentication bölümünden',
      },
      dmarc: {
        type: 'TXT',
        name: '_dmarc',
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@{domain}',
      },
      custom: [
        {
          type: 'CNAME',
          name: 's2._domainkey',
          value: '(SendGrid dashboard\'dan alınacak)',
          isDynamic: true,
        },
      ],
    },
    steps: [
      'SendGrid hesabına giriş yapın',
      'Settings → Sender Authentication → Authenticate Your Domain',
      'Domain adınızı girin ve DNS sağlayıcınızı seçin',
      'SendGrid\'in verdiği CNAME kayıtlarını kopyalayın',
      'DNS sağlayıcınızın paneline gidin',
      'CNAME ve TXT kayıtlarını ekleyin',
      'DNS yayılmasını bekleyin (48 saate kadar)',
      'SendGrid\'de "Verify" butonuna tıklayın',
    ],
  },

  postmark: {
    provider: 'postmark',
    displayName: 'Postmark',
    description: 'Fast and reliable email delivery',
    docsUrl: 'https://postmarkapp.com/support/article/1046-how-do-i-verify-a-domain',
    dashboardUrl: 'https://account.postmarkapp.com/signatures',
    records: {
      spf: {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:spf.mtasv.net ~all',
      },
      dkim: {
        type: 'TXT',
        name: '(Postmark dashboard\'dan alınacak)',
        value: '(Postmark dashboard\'dan alınacak)',
        isDynamic: true,
        note: 'Sender Signatures → Domain → DNS Records',
      },
      dmarc: {
        type: 'TXT',
        name: '_dmarc',
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@{domain}',
      },
    },
    steps: [
      'Postmark hesabına giriş yapın',
      'Sender Signatures → Add Domain',
      'Domain adınızı girin',
      'DKIM TXT kaydını kopyalayın',
      'DNS sağlayıcınızın paneline gidin',
      'SPF, DKIM ve DMARC kayıtlarını ekleyin',
      'DNS yayılmasını bekleyin (24 saate kadar)',
      'Postmark\'ta "Verify Domain" butonuna tıklayın',
    ],
  },

  mailgun: {
    provider: 'mailgun',
    displayName: 'Mailgun',
    description: 'Powerful email API for developers',
    docsUrl: 'https://documentation.mailgun.com/en/latest/user_manual.html#verifying-your-domain',
    dashboardUrl: 'https://app.mailgun.com/app/sending/domains',
    records: {
      spf: {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:mailgun.org ~all',
      },
      dkim: {
        type: 'TXT',
        name: 'mx._domainkey',
        value: '(Mailgun dashboard\'dan alınacak)',
        isDynamic: true,
        note: 'Domain Settings → DNS Records',
      },
      dmarc: {
        type: 'TXT',
        name: '_dmarc',
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@{domain}',
      },
      custom: [
        {
          type: 'MX',
          name: '@',
          value: 'mxa.mailgun.org',
          priority: 10,
        },
        {
          type: 'MX',
          name: '@',
          value: 'mxb.mailgun.org',
          priority: 10,
        },
      ],
    },
    steps: [
      'Mailgun hesabına giriş yapın',
      'Sending → Domains → Add New Domain',
      'Domain adınızı girin',
      'DNS kayıtlarını kopyalayın (SPF, DKIM, MX)',
      'DNS sağlayıcınızın paneline gidin',
      'Tüm kayıtları ekleyin',
      'DNS yayılmasını bekleyin (24-48 saat)',
      'Mailgun\'da "Verify DNS Settings" butonuna tıklayın',
    ],
  },

  ses: {
    provider: 'ses',
    displayName: 'Amazon SES',
    description: 'AWS Simple Email Service',
    docsUrl: 'https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html',
    dashboardUrl: 'https://console.aws.amazon.com/ses',
    records: {
      spf: {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:amazonses.com ~all',
      },
      dkim: {
        type: 'CNAME',
        name: '(AWS SES\'den alınacak)',
        value: '(AWS SES\'den alınacak)',
        isDynamic: true,
        note: '3 adet CNAME kaydı eklemeniz gerekir',
      },
      dmarc: {
        type: 'TXT',
        name: '_dmarc',
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@{domain}',
      },
    },
    steps: [
      'AWS Console → SES → Identities',
      'Create Identity → Domain',
      'Domain adınızı girin ve "Easy DKIM" seçeneğini aktif edin',
      '3 adet CNAME kaydını kopyalayın',
      'DNS sağlayıcınızın paneline gidin',
      'SPF, DKIM (3 CNAME) ve DMARC kayıtlarını ekleyin',
      'DNS yayılmasını bekleyin (72 saate kadar)',
      'SES\'de domain durumunun "Verified" olmasını bekleyin',
    ],
  },

  gmail: {
    provider: 'gmail',
    displayName: 'Gmail SMTP',
    description: 'Google Gmail SMTP with App Password',
    docsUrl: 'https://support.google.com/mail/answer/185833',
    records: {
      spf: {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:_spf.google.com ~all',
        note: 'Sadece özel domain kullanıyorsanız gerekli',
      },
      dmarc: {
        type: 'TXT',
        name: '_dmarc',
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@{domain}',
        note: 'Opsiyonel - özel domain için',
      },
    },
    steps: [
      'Google hesabınıza giriş yapın',
      'Güvenlik ayarlarına gidin',
      '2 faktörlü doğrulamayı aktif edin',
      'Uygulama Şifreleri bölümüne gidin',
      'Yeni uygulama şifresi oluşturun',
      'Oluşturulan şifreyi kopyalayın',
      'Ayarlarda bu şifreyi kullanın',
    ],
  },

  smtp: {
    provider: 'smtp',
    displayName: 'Özel SMTP',
    description: 'Kendi SMTP sunucunuz',
    docsUrl: '',
    records: {
      spf: {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 ip4:{server_ip} ~all',
        note: '{server_ip} yerine SMTP sunucu IP\'nizi yazın',
      },
      dmarc: {
        type: 'TXT',
        name: '_dmarc',
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@{domain}',
      },
    },
    steps: [
      'SMTP sunucu bilgilerinizi edinin',
      'SPF kaydında sunucu IP adresinizi kullanın',
      'SMTP sunucunuzda DKIM yapılandırması yapın',
      'DNS kayıtlarını ekleyin',
      'SMTP ayarlarını test edin',
    ],
  },
};

/**
 * Get DNS configuration for a specific provider
 */
export function getDNSConfiguration(provider: string): EmailProviderDNS | null {
  return EMAIL_DNS_CONFIGURATIONS[provider] || null;
}

/**
 * Replace domain placeholder in DNS records
 */
export function replaceDomainPlaceholder(value: string, domain: string): string {
  return value.replace('{domain}', domain);
}
