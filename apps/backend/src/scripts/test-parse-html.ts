import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

const file = 'SDS.txt';
const filePath = path.join(__dirname, '../../extracted_pages', file);
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
const title = lines[0].replace('Title: ', '').trim();
const htmlContent = lines.slice(1).join('\n').trim();

console.log('Title:', title);
console.log('\nHTML Length:', htmlContent.length);
console.log('\nFirst 500 chars:');
console.log(htmlContent.substring(0, 500));

const $ = cheerio.load(`<div class="content">${htmlContent}</div>`);

console.log('\n\nParsed elements:');
$('.content').children().each((i, el) => {
  const tagName = el.tagName?.toLowerCase();
  const text = $(el).text().trim().substring(0, 50);
  console.log(`${i}. <${tagName}>: ${text}...`);
});

console.log('\n\nAll h2:');
$('h2').each((i, el) => {
  console.log(`${i}. ${$(el).text().trim().substring(0, 80)}`);
});

console.log('\n\nAll h3:');
$('h3').each((i, el) => {
  console.log(`${i}. ${$(el).text().trim().substring(0, 80)}`);
});

console.log('\n\nAll ul/li:');
$('ul').each((i, el) => {
  console.log(`${i}. UL with ${$(el).find('li').length} items`);
  $(el).find('li').each((j, li) => {
    console.log(`   - ${$(li).text().trim()}`);
  });
});
