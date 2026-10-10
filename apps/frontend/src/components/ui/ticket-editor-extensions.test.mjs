import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const frontendRequire=createRequire(import.meta.url);
const domRequire=createRequire(frontendRequire.resolve('isomorphic-dompurify'));
const {JSDOM}=domRequire('jsdom');
test('ticket editor registers one copy of each extension and supports rich formatting',async()=>{
 const dom=new JSDOM('<div id="editor"></div>');Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node});Object.defineProperty(globalThis,'navigator',{configurable:true,value:dom.window.navigator});
 const {Editor}=frontendRequire('@tiptap/core');const {ticketEditorExtensions}=await import('./ticket-editor-extensions.ts');
 const editor=new Editor({element:document.getElementById('editor'),extensions:ticketEditorExtensions('Describe issue'),content:'<p>Support issue</p>'});
 try{const names=editor.extensionManager.extensions.map(extension=>extension.name);assert.equal(new Set(names).size,names.length,'Extension names must be unique');editor.commands.selectAll();editor.commands.toggleBold();editor.commands.toggleUnderline();assert.match(editor.getHTML(),/<strong>/);assert.match(editor.getHTML(),/<u>/);assert.equal(new Set(editor.state.plugins.map(plugin=>plugin.key)).size,editor.state.plugins.length);}
 finally{editor.destroy();dom.window.close();}
});
