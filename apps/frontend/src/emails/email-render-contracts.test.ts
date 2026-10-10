import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as React from 'react';
import { render } from '@react-email/components';
import { InvoiceEmail } from './invoice';
import { OrderConfirmationEmail } from './order-confirmation';
import { TicketCreatedEmail } from './ticket-created';
import { TicketAssignedEmail } from './ticket-assigned';
import { TicketResolvedEmail } from './ticket-resolved';
import { TicketNewMessageEmail } from './ticket-new-message';
import { CSATSurveyEmail } from './csat-survey';
import { MonthlyNewsletterEmail } from './monthly-newsletter';

for (const [name, component] of [
  ['invoice', InvoiceEmail], ['order confirmation', OrderConfirmationEmail],
  ['ticket created', TicketCreatedEmail], ['ticket assigned', TicketAssignedEmail],
  ['ticket resolved', TicketResolvedEmail],
] as const) {
  test(`${name} renders complete email HTML without an undefined footer URL`, async () => {
    const html = await render(React.createElement(component));
    assert.match(html, /<html/);
    assert.doesNotMatch(html, /href="undefined/);
  });
}

test('new ticket message renders escaped content and a valid style object', async () => {
  const html = await render(React.createElement(TicketNewMessageEmail, {
    messageContent: 'A < B & a customer reply',
  }));
  assert.match(html, /A &lt; B &amp; a customer reply/);
  assert.doesNotMatch(html, /href="undefined/);
});

test('CSAT footer uses the supplied brand and support email', async () => {
  const html = await render(React.createElement(CSATSurveyEmail, {
    customerName: 'Test Customer', ticketTitle: 'Example', ticketId: 'T-1',
    surveyUrl: 'https://brand.example/survey/test',
    siteSettings: { siteName: 'Test Brand', siteUrl: 'https://brand.example', supportEmail: 'help@brand.example' },
  }));
  assert.match(html, /mailto:help@brand.example/);
  assert.match(html, /Test Brand/);
  assert.match(html, /https:\/\/brand\.example\/survey\/test/);
  assert.doesNotMatch(html, /href="undefined/);
});


test('newsletter preview uses the supplied tenant identity instead of the sample tenant', async () => {
  const html = await render(React.createElement(MonthlyNewsletterEmail, {
    siteSettings: { companyName: 'Tenant B', logoUrl: 'https://tenant.example/logo.png',
      contact: { address: '', phone: '', email: 'help@tenant.example' }, socialMedia: {} },
  }));
  assert.match(html, /Tenant B&#x27;den haberler|Tenant B'den haberler/);
  assert.doesNotMatch(html, /XYZ Company/);
});
