import test from 'node:test';
import assert from 'node:assert/strict';
import {canWriteInternalNote,safeTicketHtml} from './ticket-presentation.ts';
test('ordinary or forged role hints do not expose internal note controls',()=>{for(const user of [null,{}, {roleNames:['user']},{roleNames:['customer']},{roleNames:['viewer']},{roleId:'admin'},{isPlatformAdmin:'true'}])assert.equal(canWriteInternalNote(user),false);});
test('verified staff presentation roles expose internal note controls',()=>{for(const role of ['admin','editor','support','support_manager','support_agent'])assert.equal(canWriteInternalNote({roleNames:[role]}),true);assert.equal(canWriteInternalNote({isPlatformAdmin:true}),true);});
test('rich text preserves formatting but removes executable html and tracking images',()=>{const html=safeTicketHtml('<p>Hello <strong>team</strong><img src="https://example.com/tracker" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">bad</a></p>');assert.match(html,/<strong>team<\/strong>/);assert.doesNotMatch(html,/script|onerror|<img|javascript/);});
test('plain text comparison characters remain literal',()=>assert.equal(safeTicketHtml('a < b & c > d'),'a &lt; b &amp; c &gt; d'));
