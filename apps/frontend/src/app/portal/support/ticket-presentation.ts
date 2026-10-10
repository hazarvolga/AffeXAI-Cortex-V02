import DOMPurify from 'isomorphic-dompurify';
/** Display hints only; backend independently enforces every mutation. */
export function canWriteInternalNote(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  const actor = user as {isPlatformAdmin?: unknown; roleNames?: unknown};
  return actor.isPlatformAdmin === true || (Array.isArray(actor.roleNames) && actor.roleNames.some(role => ['admin','editor','support','support_manager','support_agent'].includes(role)));
}
export function safeTicketHtml(content: string): string {
  const source = /<\/?[a-z][^>]*>/i.test(content) ? content : content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return DOMPurify.sanitize(source, {ALLOWED_TAGS:['p','br','strong','b','em','i','u','s','ul','ol','li','blockquote','pre','code','h1','h2','h3','a'],ALLOWED_ATTR:['href','title']});
}
