import { ServiceUnavailableException } from '@nestjs/common';
import { TicketEmailParserService, ParsedEmail } from './ticket-email-parser.service';

describe('TicketEmailParserService explicitly unavailable inbound mutation',()=>{
 const service=new TicketEmailParserService();
 const base:ParsedEmail={from:'customer@example.test',to:'support@example.test',subject:'A support request',textBody:'Help',messageId:'fixture-message',receivedAt:new Date()};
 it.each([
  {},{from:'staff@example.test'},{fromName:'Trusted Administrator'},
  {subject:'[#SUP-00001] Request'},{subject:'Ticket #123 Reply'},
  {inReplyTo:'<ticket-existing@example.test>'},{references:['<trusted@example.test>']},
  {htmlBody:'<p>Reply</p>'},{attachments:[{filename:'fixture.txt',contentType:'text/plain',content:Buffer.from('fixture'),size:7}]},
  {tenantId:'forged-tenant'},{authorId:'forged-author'},
 ])('rejects provider/header/payload authority before any processing: %j',async override=>{
  await expect(service.processInboundEmail({...base,...override})).rejects.toBeInstanceOf(ServiceUnavailableException);
 });
 it('returns explicit503 instead of accepted or silent success',async()=>{
  try{await service.processInboundEmail(base);throw new Error('unexpected success');}catch(error){expect(error).toBeInstanceOf(ServiceUnavailableException);expect((error as ServiceUnavailableException).getStatus()).toBe(503);}
 });
 it.each(['test@example.test','user.name@company.co.uk'])('validates email shape %s',email=>expect(service.validateEmail(email)).toBe(true));
 it.each(['invalid-email','@example.test','name@','name @example.test','name@example',''])('rejects malformed email shape %s',email=>expect(service.validateEmail(email)).toBe(false));
});
