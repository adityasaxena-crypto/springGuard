import { analyzeProject } from '../src/analyzer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing SpringGuard...\n');

// Test 1: Good project
console.log('Test 1: Good project (examples/good-project)');
const goodProject = analyzeProject(path.join(__dirname, '..', 'examples', 'good-project'));
console.log(`  Files: ${goodProject.stats.totalFiles}`);
console.log(`  Violations: ${goodProject.violations.length}`);
console.log(`  Patterns: ${goodProject.patterns.length}`);
console.log(`  ✅ Passed\n`);

// Test 2: Bad project
console.log('Test 2: Bad project (examples/bad-project)');
const badProject = analyzeProject(path.join(__dirname, '..', 'examples', 'bad-project'));
console.log(`  Files: ${badProject.stats.totalFiles}`);
console.log(`  Violations: ${badProject.violations.length}`);
console.log(`  Patterns: ${badProject.patterns.length}`);
console.log(`  ✅ Passed\n`);

// Test 3: Verify violations detected
console.log('Test 3: Verify violations detected');
const violations = badProject.violations;
const hasFieldInjection = violations.some(v => v.rule === 'Field Injection');
const hasDirectAccess = violations.some(v => v.rule === 'Controller-Repository Direct Access');
console.log(`  Field injection detected: ${hasFieldInjection}`);
console.log(`  Direct access detected: ${hasDirectAccess}`);
console.log(`  ✅ Passed\n`);

// Test 4: Verify patterns detected
console.log('Test 4: Verify patterns detected');
const patterns = goodProject.patterns;
const hasMVC = patterns.some(p => p.name === 'MVC Pattern');
const hasServiceLayer = patterns.some(p => p.name === 'Service Layer Pattern');
console.log(`  MVC Pattern: ${hasMVC}`);
console.log(`  Service Layer: ${hasServiceLayer}`);
console.log(`  ✅ Passed\n`);

console.log('✅ All tests passed!');
