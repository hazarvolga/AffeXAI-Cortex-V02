import { EmailWebhookAdapterFactory } from './email-webhook-adapter-factory.service';
import { ResendWebhookAdapter } from '../adapters/resend-webhook.adapter';
import { SendGridWebhookAdapter } from '../adapters/sendgrid-webhook.adapter';
import { MailgunWebhookAdapter } from '../adapters/mailgun-webhook.adapter';
import { PostmarkWebhookAdapter } from '../adapters/postmark-webhook.adapter';
import { SESWebhookAdapter } from '../adapters/ses-webhook.adapter';

describe('EmailWebhookAdapterFactory inbound selector',()=>{
 const adapters=[new ResendWebhookAdapter(),new SendGridWebhookAdapter(),new MailgunWebhookAdapter(),new PostmarkWebhookAdapter(),new SESWebhookAdapter()] as const;
 const service=new EmailWebhookAdapterFactory(...adapters);
 it.each(['resend','sendgrid','mailgun','postmark','ses'])('selects registered %s adapter',provider=>{expect(service.getAdapter(provider)).toBe(adapters[['resend','sendgrid','mailgun','postmark','ses'].indexOf(provider)]);});
 it.each(['smtp','unknown','SENDGRID'])('rejects unsupported provider %s',provider=>{expect(()=>service.getAdapter(provider)).toThrow('Unsupported');});
 it('lists only registered inbound providers',()=>{expect(service.getSupportedProviders()).toEqual(['resend','sendgrid','mailgun','postmark','ses']);});
 it.each([
  [{message_id:'m',from:'a',to:'b'},0],
  [{headers:'From: a',text:'body'},1],
  [{sender:'a',recipient:'b','body-plain':'body'},2],
  [{MessageID:'m',From:'a',To:'b',TextBody:''},3],
  [{Type:'Notification',Message:'{}'},4],
  [{mail:{}},4],
 ])('detects recognized payload %j',(payload,index)=>{expect(service.getAdapter('auto',payload)).toBe(adapters[index as number]);});
 it.each([undefined,null,{},[], 'unknown'])('rejects unknown payload instead of guessing provider %j',payload=>{expect(()=>service.getAdapter('auto',payload)).toThrow();});
});
