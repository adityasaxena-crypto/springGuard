#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENTS_MD = path.join(__dirname, '..', 'AGENTS.md');

try {
  if (fs.existsSync(AGENTS_MD)) {
    const rules = fs.readFileSync(AGENTS_MD, 'utf-8');
    console.log(rules);
  }
} catch (error) {
  console.error('Error injecting SpringGuard rules:', error.message);
}
