#!/usr/bin/env tsx
/**
 * Unit Tests for IndustrySolutionParser
 * Tests hero extraction, feature extraction, and stats extraction
 */

import { IndustrySolutionParser } from '../IndustrySolutionParser';

const parser = new IndustrySolutionParser();

console.log('Running Unit Tests for IndustrySolutionParser...\n');

// Test 1: Hero extraction with sample HTML
console.log('Test 1: Hero extraction with sample HTML');
try {
  const htmlContent = `
    <h2>ALLPLAN</h2>
    <h2>MİMARİ</h2>
    <h2>DAHA FAZLASINI İSTEYEN MİMARLAR İÇİN.</h2>
    <a href="#akis">İŞ AKIŞINI KEŞFEDİN</a>
    <img src="https://example.com/hero.jpg" alt="Hero" />
  `;
  
  const parsed = parser.parseIndustrySolution(htmlContent, 'test-architecture.txt');
  
  // Verify hero section
  if (!parsed.hero) {
    throw new Error('Hero section not found');
  }
  
  if (parsed.hero.title !== 'ALLPLAN') {
    throw new Error(`Expected title 'ALLPLAN', got '${parsed.hero.title}'`);
  }
  
  if (parsed.hero.subtitle !== 'MİMARİ') {
    throw new Error(`Expected subtitle 'MİMARİ', got '${parsed.hero.subtitle}'`);
  }
  
  if (!parsed.hero.description.includes('MİMARLAR')) {
    throw new Error(`Expected description to include 'MİMARLAR', got '${parsed.hero.description}'`);
  }
  
  if (!parsed.hero.primaryButton) {
    throw new Error('Primary button not found');
  }
  
  if (parsed.hero.primaryButton.text !== 'İŞ AKIŞINI KEŞFEDİN') {
    throw new Error(`Expected button text 'İŞ AKIŞINI KEŞFEDİN', got '${parsed.hero.primaryButton.text}'`);
  }
  
  if (parsed.hero.primaryButton.url !== '#akis') {
    throw new Error(`Expected button URL '#akis', got '${parsed.hero.primaryButton.url}'`);
  }
  
  if (!parsed.hero.backgroundImage) {
    throw new Error('Background image not found');
  }
  
  console.log('✓ Test 1 passed: Hero extraction works correctly');
} catch (error: any) {
  console.error('✗ Test 1 failed:', error.message);
  process.exit(1);
}

// Test 2: Feature extraction with icons
console.log('\nTest 2: Feature extraction with icons');
try {
  const htmlContent = `
    <figure>
      <img width="52" height="64" src="https://example.com/icon1.png" alt="Icon 1" />
    </figure>
    <h3>İSTEDİĞİNİZ GİBİ ÇALIŞIN</h3>
    <p>2B, 2.5B ve 3B'de esnek iş akışlarının yanı sıra tam obje yönelimli BIM çalışma metodolojisi.</p>
    
    <figure>
      <img width="52" height="48" src="https://example.com/icon2.png" alt="Icon 2" />
    </figure>
    <h3>GÜÇLÜ ve SEZGİSEL MODELLEME</h3>
    <p>Bina bileşenlerini hızla geliştirmek için güçlü araçlar.</p>
  `;
  
  const parsed = parser.parseIndustrySolution(htmlContent, 'test-features.txt');
  
  // Verify features section
  if (!parsed.features) {
    throw new Error('Features section not found');
  }
  
  if (parsed.features.features.length !== 2) {
    throw new Error(`Expected 2 features, got ${parsed.features.features.length}`);
  }
  
  const feature1 = parsed.features.features[0];
  if (feature1.title !== 'İSTEDİĞİNİZ GİBİ ÇALIŞIN') {
    throw new Error(`Expected feature 1 title 'İSTEDİĞİNİZ GİBİ ÇALIŞIN', got '${feature1.title}'`);
  }
  
  if (!feature1.icon.includes('icon1.png')) {
    throw new Error(`Expected feature 1 icon to include 'icon1.png', got '${feature1.icon}'`);
  }
  
  if (!feature1.description.includes('BIM')) {
    throw new Error(`Expected feature 1 description to include 'BIM', got '${feature1.description}'`);
  }
  
  const feature2 = parsed.features.features[1];
  if (feature2.title !== 'GÜÇLÜ ve SEZGİSEL MODELLEME') {
    throw new Error(`Expected feature 2 title 'GÜÇLÜ ve SEZGİSEL MODELLEME', got '${feature2.title}'`);
  }
  
  console.log('✓ Test 2 passed: Feature extraction works correctly');
} catch (error: any) {
  console.error('✗ Test 2 failed:', error.message);
  process.exit(1);
}

// Test 3: Stats extraction
console.log('\nTest 3: Stats extraction');
try {
  const htmlContent = `
    <div>
      <h3>DAHA KESİN</h3>
      <p>50%</p>
      <p>Daha hızlı ve daha kesin tasarım çıktıları</p>
    </div>
    
    <div>
      <h3>DAHA VERİMLİ</h3>
      <p>70%</p>
      <p>Güvenilir otomatik malzeme çıktısı</p>
    </div>
    
    <div>
      <h3>DAHA ÜRETKEN</h3>
      <p>30%</p>
      <p>İşbirliğine dayalı planlamayı destekleyen verimli iş akışları</p>
    </div>
  `;
  
  const parsed = parser.parseIndustrySolution(htmlContent, 'test-stats.txt');
  
  // Verify stats section
  if (!parsed.stats) {
    throw new Error('Stats section not found');
  }
  
  if (parsed.stats.stats.length !== 3) {
    throw new Error(`Expected 3 stats, got ${parsed.stats.stats.length}`);
  }
  
  const stat1 = parsed.stats.stats[0];
  if (stat1.value !== '50%') {
    throw new Error(`Expected stat 1 value '50%', got '${stat1.value}'`);
  }
  
  const stat2 = parsed.stats.stats[1];
  if (stat2.value !== '70%') {
    throw new Error(`Expected stat 2 value '70%', got '${stat2.value}'`);
  }
  
  const stat3 = parsed.stats.stats[2];
  if (stat3.value !== '30%') {
    throw new Error(`Expected stat 3 value '30%', got '${stat3.value}'`);
  }
  
  console.log('✓ Test 3 passed: Stats extraction works correctly');
} catch (error: any) {
  console.error('✗ Test 3 failed:', error.message);
  process.exit(1);
}

// Test 4: Workflow tabs extraction
console.log('\nTest 4: Workflow tabs extraction');
try {
  const htmlContent = `
    <ul role="tablist">
      <li id="tab-1" aria-selected="true" data-tab="1" role="tab">
        Ön ve Konsept Tasarım
      </li>
      <li id="tab-2" aria-selected="false" data-tab="2" role="tab">
        Tasarım Geliştirmek
      </li>
      <li id="tab-3" aria-selected="false" data-tab="3" role="tab">
        Detaylı Tasarım
      </li>
    </ul>
  `;
  
  const parsed = parser.parseIndustrySolution(htmlContent, 'test-workflow.txt');
  
  // Verify workflow tabs
  if (!parsed.workflowTabs) {
    throw new Error('Workflow tabs section not found');
  }
  
  if (parsed.workflowTabs.mainTabs.length !== 3) {
    throw new Error(`Expected 3 main tabs, got ${parsed.workflowTabs.mainTabs.length}`);
  }
  
  const tab1 = parsed.workflowTabs.mainTabs[0];
  if (tab1.id !== 'tab-1') {
    throw new Error(`Expected tab 1 id 'tab-1', got '${tab1.id}'`);
  }
  
  if (!tab1.label.includes('Konsept')) {
    throw new Error(`Expected tab 1 label to include 'Konsept', got '${tab1.label}'`);
  }
  
  console.log('✓ Test 4 passed: Workflow tabs extraction works correctly');
} catch (error: any) {
  console.error('✗ Test 4 failed:', error.message);
  process.exit(1);
}

// Test 5: Real-world sample from 2024-ARCHITECTURE.txt
console.log('\nTest 5: Real-world sample parsing');
try {
  const htmlContent = `
    <h2>ALLPLAN</h2>
    <h2>MİMARİ</h2>
    <h2>DAHA FAZLASINI İSTEYEN MİMARLAR İÇİN.</h2>
    <a href="#akis">İŞ AKIŞINI KEŞFEDİN</a>
    
    <figure>
      <img src="https://example.com/work-way.png" alt="Work Way" />
    </figure>
    <h3>İSTEDİĞİNİZ GİBİ ÇALIŞIN</h3>
    <p>2B, 2.5B ve 3B'de esnek iş akışları.</p>
    
    <figure>
      <img src="https://example.com/modeling.png" alt="Modeling" />
    </figure>
    <h3>GÜÇLÜ MODELLEME</h3>
    <p>Güçlü araçlarla desteklenen modelleme.</p>
    
    <div>50%</div>
    <p>Daha hızlı tasarım çıktıları</p>
    
    <ul role="tablist">
      <li id="pre-concept" role="tab">Ön ve Konsept Tasarım</li>
      <li id="develop" role="tab">Tasarım Geliştirmek</li>
    </ul>
  `;
  
  const parsed = parser.parseIndustrySolution(htmlContent, '2024-ARCHITECTURE.txt');
  
  // Verify all sections are present
  if (!parsed.hero) {
    throw new Error('Hero section missing');
  }
  
  if (!parsed.features || parsed.features.features.length < 2) {
    throw new Error('Features section missing or incomplete');
  }
  
  if (!parsed.stats || parsed.stats.stats.length < 1) {
    throw new Error('Stats section missing or incomplete');
  }
  
  if (!parsed.workflowTabs || parsed.workflowTabs.mainTabs.length < 2) {
    throw new Error('Workflow tabs missing or incomplete');
  }
  
  console.log('✓ Test 5 passed: Real-world sample parsing works correctly');
} catch (error: any) {
  console.error('✗ Test 5 failed:', error.message);
  process.exit(1);
}

console.log('\n✓ All unit tests passed!');
console.log('IndustrySolutionParser is working correctly.');
