#!/usr/bin/env ts-node

/**
 * Enhanced Report Generation Script for Restified
 * 
 * This script automatically enhances Mochawesome HTML reports with
 * collapsible Request/Response sections after test execution.
 */

import * as path from 'path';
import * as fs from 'fs';
import { HtmlReportInjector } from '../src/reporting/html-report-injector';

async function main(): Promise<void> {
  console.log('🚀 Restified: Enhancing HTML reports with Request/Response viewer...\n');

  try {
    // Define report paths
    const reportPaths = [
      'mochawesome-report/mochawesome.html',
      'reports/mochawesome.html',
      'reports/enterprise-test-report.html',
      'test-reports/mochawesome.html'
    ];

    let enhancedCount = 0;

    // Check each potential report path
    for (const reportPath of reportPaths) {
      const fullPath = path.resolve(reportPath);
      
      if (fs.existsSync(fullPath)) {
        console.log(`📋 Found report: ${reportPath}`);
        await HtmlReportInjector.injectEnhancements(fullPath);
        enhancedCount++;
      }
    }

    // Also check for reports directory and enhance all HTML files
    const reportDirs = [
      'mochawesome-report',
      'reports',
      'test-reports'
    ];

    for (const dir of reportDirs) {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        console.log(`📁 Checking directory: ${dir}`);
        await HtmlReportInjector.injectEnhancementsIntoDirectory(dir);
      }
    }

    console.log(`\n✅ Enhancement complete!`);
    
    if (enhancedCount > 0) {
      console.log(`\n🎉 Your HTML reports now include collapsible Request/Response sections!`);
      console.log(`\n📖 Features added:`);
      console.log(`   • 📤 Collapsible Request sections with method badges`);
      console.log(`   • 📥 Collapsible Response sections with status badges`);  
      console.log(`   • 📋 Copy-to-clipboard functionality for all data`);
      console.log(`   • 🎨 Enhanced styling with syntax highlighting`);
      console.log(`   • ✅ Assertion summaries with pass/fail indicators`);
      console.log(`   • ⏱️  Response timing information`);
      console.log(`\n🔍 Open your HTML report to see the enhanced Request/Response viewer!`);
    } else {
      console.log('\n⚠️  No HTML reports found to enhance.');
      console.log('   Make sure to run your tests first to generate reports.');
    }

  } catch (error) {
    console.error('\n❌ Error enhancing reports:', error);
    process.exit(1);
  }
}

// Command line usage information
function showUsage(): void {
  console.log(`
🚀 Restified Report Enhancer

Usage: 
  npm run enhance-reports
  ts-node scripts/enhance-reports.ts
  node scripts/enhance-reports.js

This script automatically finds and enhances Mochawesome HTML reports with:
• Collapsible Request/Response sections  
• Copy-to-clipboard functionality
• Enhanced styling and syntax highlighting
• Assertion summaries

Report locations checked:
  • mochawesome-report/mochawesome.html
  • reports/mochawesome.html  
  • reports/enterprise-test-report.html
  • test-reports/mochawesome.html
  
Plus all .html files in report directories.
`);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('Restified Report Enhancer v1.0.0');
  process.exit(0);
}

// Run the main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});