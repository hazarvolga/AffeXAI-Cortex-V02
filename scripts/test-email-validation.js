#!/usr/bin/env node

/**
 * Email Validation Test Script
 *
 * Tests various email formats against our validation rules
 */

// Same regex as frontend and backend
const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

function validateEmail(email) {
  if (typeof email !== 'string') {
    return { valid: false, reason: 'Not a string' };
  }

  // Basic regex test
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid format (regex)' };
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return { valid: false, reason: 'Contains consecutive dots (..)' };
  }

  const [localPart, domain] = email.split('@');

  // Check if local part starts or ends with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, reason: 'Cannot start/end with dot' };
  }

  // Check domain has valid TLD (at least 2 characters)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return { valid: false, reason: 'Invalid TLD (min 2 chars)' };
  }

  // Email length check (RFC 5321: max 254 characters)
  if (email.length > 254) {
    return { valid: false, reason: 'Too long (max 254 chars)' };
  }

  // Local part length check (RFC 5321: max 64 characters)
  if (localPart.length > 64) {
    return { valid: false, reason: 'Local part too long (max 64 chars)' };
  }

  return { valid: true, reason: 'Valid email' };
}

// Test cases
const testCases = [
  // Valid emails
  { email: 'user@example.com', expected: true },
  { email: 'test.user@example.com', expected: true },
  { email: 'user_name@example.co.uk', expected: true },
  { email: 'user-name@example.com', expected: true },
  { email: 'a@example.com', expected: true },
  { email: 'user123@test-domain.com', expected: true },

  // Invalid emails - consecutive dots
  { email: 'hazarvolga@hotmai..l.com', expected: false, reason: 'consecutive dots' },
  { email: 'user..name@example.com', expected: false, reason: 'consecutive dots in local' },
  { email: 'user@exam..ple.com', expected: false, reason: 'consecutive dots in domain' },

  // Invalid emails - start/end with dot
  { email: '.user@example.com', expected: false, reason: 'starts with dot' },
  { email: 'user.@example.com', expected: false, reason: 'ends with dot' },

  // Invalid emails - missing parts
  { email: 'userexample.com', expected: false, reason: 'missing @' },
  { email: '@example.com', expected: false, reason: 'missing local part' },
  { email: 'user@', expected: false, reason: 'missing domain' },
  { email: 'user@example', expected: false, reason: 'missing TLD' },

  // Invalid emails - invalid TLD
  { email: 'user@example.c', expected: false, reason: 'TLD too short' },

  // Invalid emails - invalid characters
  { email: 'user name@example.com', expected: false, reason: 'space in local' },
  { email: 'user@exam ple.com', expected: false, reason: 'space in domain' },

  // Invalid emails - multiple @
  { email: 'user@@example.com', expected: false, reason: 'multiple @ symbols' },
  { email: 'user@domain@example.com', expected: false, reason: 'multiple @ symbols' },

  // Edge cases
  { email: 'a@b.co', expected: true, reason: 'minimal valid email' },
  { email: 'very.long.email.address.with.many.dots@example.com', expected: true },
];

console.log('\n📧 Email Validation Test Results\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateEmail(testCase.email);
  const success = result.valid === testCase.expected;

  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASS`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAIL`);
  }

  console.log(`   Email: ${testCase.email}`);
  console.log(`   Expected: ${testCase.expected ? 'VALID' : 'INVALID'}`);
  console.log(`   Got: ${result.valid ? 'VALID' : 'INVALID'}`);
  console.log(`   Reason: ${result.reason}`);

  if (testCase.reason) {
    console.log(`   Test Case: ${testCase.reason}`);
  }

  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the validation logic.\n');
  process.exit(1);
}
