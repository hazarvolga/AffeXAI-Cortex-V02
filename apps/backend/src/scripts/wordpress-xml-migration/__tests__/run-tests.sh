#!/bin/bash
# Simple test runner for migration tests

cd "$(dirname "$0")"

echo "🧪 Running XMLParser unit tests..."
npx ts-node --transpile-only unit/xml-parser.test.ts
