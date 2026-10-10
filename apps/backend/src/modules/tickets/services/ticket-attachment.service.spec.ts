import { validateTicketAttachment } from './ticket-attachment-validation';
const file=(name:string,buffer:Buffer,mime:string)=>({originalname:name,buffer,size:buffer.length,mimetype:mime} as Express.Multer.File);
function officeFixture(directory:string):Buffer {
 const entries=['[Content_Types].xml',`${directory}/document.xml`].map(name=>{const header=Buffer.alloc(46);header.writeUInt32LE(0x02014b50);header.writeUInt16LE(Buffer.byteLength(name),28);return Buffer.concat([header,Buffer.from(name)]);});
 const local=Buffer.from('504b0304','hex'),central=Buffer.concat(entries),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(2,8);end.writeUInt16LE(2,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(local.length,16);return Buffer.concat([local,central,end]);
}
describe('attachment bounded structural type validation',()=>{
 it.each([
  ['fixture.jpg','ffd8ffe0','image/jpeg'],['fixture.png','89504e470d0a1a0a','image/png'],['fixture.gif','474946383961','image/gif'],['fixture.webp','524946460000000057454250','image/webp'],['fixture.pdf','255044462d312e37','application/pdf'],
 ])('recognizes allowed signature %s',(name,hex,mime)=>{expect(validateTicketAttachment(file(name,Buffer.from(hex,'hex'),mime)).mime).toBe(mime);});
 it.each([['txt','text/plain'],['csv','text/csv'],['md','text/markdown']])('accepts valid UTF8 %s',(ext,mime)=>{expect(validateTicketAttachment(file(`Türkçe.${ext}`,Buffer.from('Türkçe fixture'),mime)).mime).toBe(mime);});
 it.each([['docx','word','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],['xlsx','xl','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],['pptx','ppt','application/vnd.openxmlformats-officedocument.presentationml.presentation']])('requires matching bounded office directory %s',(ext,directory,mime)=>{expect(validateTicketAttachment(file(`fixture.${ext}`,officeFixture(directory),mime)).mime).toBe(mime);expect(()=>validateTicketAttachment(file(`fixture.${ext}`,officeFixture('unrelated'),mime))).toThrow();});
 it.each([['doc','WordDocument','application/msword'],['xls','Workbook','application/vnd.ms-excel'],['ppt','PowerPoint Document','application/vnd.ms-powerpoint']])('recognizes legacy office container %s',(ext,stream,mime)=>{const bytes=Buffer.concat([Buffer.from('d0cf11e0a1b11ae1','hex'),Buffer.from(stream,'utf16le')]);expect(validateTicketAttachment(file(`fixture.${ext}`,bytes,mime)).mime).toBe(mime);});
 it.each(['../file.txt','folder\\file.txt','bad\nname.txt','',`${'a'.repeat(256)}.txt`])('rejects unsafe filename %p',name=>{expect(()=>validateTicketAttachment(file(name,Buffer.from('fixture'),'text/plain'))).toThrow();});
 it('rejects empty, size mismatch, oversized and invalid UTF8 bytes',()=>{
  for(const bytes of [Buffer.alloc(0),Buffer.alloc(10*1024*1024+1),Buffer.from([0xff,0xfe,0xfd])]) expect(()=>validateTicketAttachment(file('fixture.txt',bytes,'text/plain'))).toThrow();
  expect(()=>validateTicketAttachment({...file('fixture.txt',Buffer.from('fixture'),'text/plain'),size:1})).toThrow();
 });
 it('rejects malformed ZIP bounds without extracting content',()=>{
  const bytes=officeFixture('word');bytes.writeUInt32LE(0xffffff00,bytes.length-6);
  expect(()=>validateTicketAttachment(file('fixture.docx',bytes,'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toThrow();
 });
});
