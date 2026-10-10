#!/usr/bin/env tsx
import { ContentParser } from './ContentParser';

const parser = new ContentParser();

// Test with the failing counterexample
const data = {
  title: "    0",
  paragraphs: ["         !  j      !"],
  headings: []
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function extractAllText(parsed: any): string {
  let text = parsed.title + ' ';
  
  for (const section of parsed.sections) {
    if (section.content) {
      text += JSON.stringify(section.content) + ' ';
    }
  }
  
  return text;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sığüşöçİĞÜŞÖÇ0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const htmlContent = `
  <h1>${escapeHtml(data.title)}</h1>
  ${data.headings.map(h => `<h2>${escapeHtml(h)}</h2>`).join('\n')}
  ${data.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n')}
`;

console.log('HTML Content:');
console.log(htmlContent);
console.log('\n---\n');

const parsed = parser.parse(htmlContent, 'test-file.txt');

console.log('Parsed:');
console.log(JSON.stringify(parsed, null, 2));
console.log('\n---\n');

const parsedText = extractAllText(parsed);
console.log('Extracted text from parsed:');
console.log(parsedText);
console.log('\n---\n');

const originalText = normalizeText(
  data.title + ' ' + 
  data.headings.join(' ') + ' ' + 
  data.paragraphs.join(' ')
);

console.log('Original text (normalized):');
console.log(originalText);
console.log('\n---\n');

const normalizedParsed = normalizeText(parsedText);
console.log('Parsed text (normalized):');
console.log(normalizedParsed);
console.log('\n---\n');

const words = originalText.split(/\s+/);
console.log('Original words:', words);
console.log('\n---\n');

const result = words.every(word => {
  if (word.length === 0) return true;
  const found = normalizedParsed.includes(word);
  console.log(`Word "${word}" found: ${found}`);
  return found;
});

console.log('\n---\n');
console.log('Test result:', result);
