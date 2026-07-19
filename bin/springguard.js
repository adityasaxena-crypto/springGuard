#!/usr/bin/env node

import { analyzeProject } from '../src/analyzer.js';
import fs from 'fs';
import path from 'path';

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

function printBanner() {
  console.log(`
${c.cyan}${c.bright}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🛡️  SpringGuard - Spring Boot Best Practices Enforcer       ║
║                                                               ║
║   Makes your AI agent think like a senior Spring developer    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}
`);
}

function printLayerSummary(layers) {
  console.log(`${c.bright}📦 Architecture Layers:${c.reset}\n`);
  
  const activeLayers = Object.entries(layers).filter(([_, mods]) => mods.length > 0);
  
  if (activeLayers.length === 0) {
    console.log(`  ${c.yellow}No layers detected${c.reset}`);
    return;
  }
  
  for (const [layer, modules] of activeLayers) {
    const icon = getLayerIcon(layer);
    console.log(`  ${icon} ${c.cyan}${layer}${c.reset}: ${modules.length} file(s)`);
  }
}

function getLayerIcon(layer) {
  const icons = {
    controller: '🎮',
    service: '⚙️',
    repository: '💾',
    entity: '📊',
    dto: '📦',
    config: '🔧',
    security: '🔒',
    exception: '⚠️',
    util: '🛠️',
    other: '📄'
  };
  return icons[layer] || '📄';
}

function printPatterns(patterns) {
  if (patterns.length === 0) return;
  
  console.log(`\n${c.bright}🔍 Patterns Detected:${c.reset}\n`);
  
  for (const pattern of patterns) {
    const icon = pattern.status === 'detected' ? '✅' : '⚠️';
    const color = pattern.status === 'detected' ? c.green : c.yellow;
    console.log(`  ${icon} ${color}${pattern.name}${c.reset}`);
    console.log(`     ${c.dim}${pattern.description}${c.reset}`);
  }
}

function printViolations(violations) {
  if (violations.length === 0) {
    console.log(`\n${c.green}${c.bright}✅ No violations found!${c.reset}`);
    return;
  }
  
  console.log(`\n${c.red}${c.bright}⚠️  Violations Found: ${violations.length}${c.reset}\n`);
  
  // Group by severity
  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');
  const info = violations.filter(v => v.severity === 'info');
  
  if (errors.length > 0) {
    console.log(`${c.red}${c.bright}Errors:${c.reset}`);
    for (const v of errors) {
      console.log(`  ${c.red}✗${c.reset} ${c.bright}${v.rule}${c.reset}`);
      console.log(`    ${c.dim}File: ${v.path}${c.reset}`);
      console.log(`    ${v.message}`);
      console.log(`    ${c.green}Fix: ${v.fix}${c.reset}\n`);
    }
  }
  
  if (warnings.length > 0) {
    console.log(`${c.yellow}${c.bright}Warnings:${c.reset}`);
    for (const v of warnings) {
      console.log(`  ${c.yellow}⚠${c.reset} ${c.bright}${v.rule}${c.reset}`);
      console.log(`    ${c.dim}File: ${v.path}${c.reset}`);
      console.log(`    ${v.message}`);
      console.log(`    ${c.green}Fix: ${v.fix}${c.reset}\n`);
    }
  }
  
  if (info.length > 0) {
    console.log(`${c.blue}${c.bright}Info:${c.reset}`);
    for (const v of info) {
      console.log(`  ${c.blue}ℹ${c.reset} ${c.bright}${v.rule}${c.reset}`);
      console.log(`    ${c.dim}File: ${v.path}${c.reset}`);
      console.log(`    ${v.message}`);
      console.log(`    ${c.green}Fix: ${v.fix}${c.reset}\n`);
    }
  }
}

function printWarnings(warnings) {
  if (warnings.length === 0) return;
  
  console.log(`\n${c.yellow}${c.bright}⚡ Warnings:${c.reset}\n`);
  
  for (const w of warnings) {
    const icon = w.severity === 'high' ? '🔴' : w.severity === 'medium' ? '🟡' : '🟢';
    console.log(`  ${icon} ${c.bright}${w.message}${c.reset}`);
    console.log(`     ${w.description}`);
    console.log(`     ${c.cyan}Suggestion: ${w.suggestion}${c.reset}\n`);
  }
}

function printSuggestions(suggestions) {
  if (suggestions.length === 0) return;
  
  console.log(`\n${c.cyan}${c.bright}💡 Suggestions:${c.reset}\n`);
  
  for (const s of suggestions) {
    const icon = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
    console.log(`${icon} ${c.bright}${s.title}${c.reset}`);
    console.log(`   ${s.description}`);
    console.log(`   ${c.dim}Category: ${s.category}${c.reset}`);
    console.log(`\n${c.dim}Example:${c.reset}`);
    console.log(`${c.green}${s.example}${c.reset}`);
    console.log(`${'─'.repeat(60)}\n`);
  }
}

function printStats(stats) {
  console.log(`\n${c.bright}📊 Statistics:${c.reset}\n`);
  console.log(`  Total Files: ${stats.totalFiles}`);
  console.log(`  Total Lines: ${stats.totalLines}`);
  
  if (Object.keys(stats.byLayer).length > 0) {
    console.log(`\n  ${c.dim}Files by Layer:${c.reset}`);
    for (const [layer, count] of Object.entries(stats.byLayer)) {
      if (count > 0) {
        console.log(`    ${layer}: ${count}`);
      }
    }
  }
}

function printReport(results) {
  printBanner();
  
  printLayerSummary(results.layers);
  printPatterns(results.patterns);
  printViolations(results.violations);
  printWarnings(results.warnings);
  printSuggestions(results.suggestions);
  printStats(results.stats);
  
  // Summary
  console.log(`\n${c.cyan}${'═'.repeat(60)}${c.reset}`);
  
  const errorCount = results.violations.filter(v => v.severity === 'error').length;
  const warningCount = results.violations.filter(v => v.severity === 'warning').length;
  
  if (errorCount > 0) {
    console.log(`\n${c.red}${c.bright}❌ Found ${errorCount} error(s) and ${warningCount} warning(s)${c.reset}`);
    console.log(`${c.dim}Fix the errors to improve your Spring Boot application${c.reset}`);
  } else if (warningCount > 0) {
    console.log(`\n${c.yellow}${c.bright}⚠️  Found ${warningCount} warning(s)${c.reset}`);
    console.log(`${c.dim}Consider fixing these to follow best practices${c.reset}`);
  } else {
    console.log(`\n${c.green}${c.bright}✅ Your Spring Boot application follows best practices!${c.reset}`);
  }
  
  console.log(`\n${c.cyan}${'═'.repeat(60)}${c.reset}\n`);
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'analyze';
const projectPath = args[1] || '.';

if (command === 'help' || command === '--help' || command === '-h') {
  printBanner();
  console.log(`
Usage: springguard [command] [path]

Commands:
  analyze [path]   Analyze Spring Boot project (default)
  check [path]     Check for violations only
  help             Show this help message

Examples:
  springguard analyze .
  springguard analyze /path/to/spring-boot-project
  springguard check .

Options:
  --json           Output as JSON
  --quiet          Minimal output
`);
  process.exit(0);
}

if (!fs.existsSync(projectPath)) {
  console.error(`${c.red}Error: Path '${projectPath}' does not exist${c.reset}`);
  process.exit(1);
}

// Check if it's a Java/Spring Boot project
const hasPomXml = fs.existsSync(path.join(projectPath, 'pom.xml'));
const hasBuildGradle = fs.existsSync(path.join(projectPath, 'build.gradle')) || 
                       fs.existsSync(path.join(projectPath, 'build.gradle.kts'));
const hasSrcMain = fs.existsSync(path.join(projectPath, 'src', 'main', 'java'));

if (!hasPomXml && !hasBuildGradle && !hasSrcMain) {
  console.error(`${c.red}Error: '${projectPath}' doesn't appear to be a Java/Spring Boot project${c.reset}`);
  console.error(`${c.dim}Expected: pom.xml, build.gradle, or src/main/java/${c.reset}`);
  process.exit(1);
}

const results = analyzeProject(projectPath);

if (args.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
} else if (command === 'check') {
  // Quick check mode
  if (results.violations.length === 0) {
    console.log(`${c.green}✅ No violations found${c.reset}`);
    process.exit(0);
  } else {
    console.log(`${c.red}Found ${results.violations.length} violation(s):${c.reset}\n`);
    for (const v of results.violations) {
      const icon = v.severity === 'error' ? '✗' : v.severity === 'warning' ? '⚠' : 'ℹ';
      console.log(`  ${icon} ${v.rule}: ${v.message}`);
    }
    process.exit(1);
  }
} else {
  printReport(results);
}
