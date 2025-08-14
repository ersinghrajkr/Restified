#!/usr/bin/env node
/**
 * Comprehensive Report Generation Script for CI/CD Integration
 * 
 * This script generates consolidated reports from multiple test runs,
 * merges JSON reports, and creates a comprehensive HTML report.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const OUTPUT_DIR = path.join(REPORTS_DIR, 'final');

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Run command and handle errors
 */
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.log(`⚠️  ${description} failed:`, error.message);
    return false;
  }
}

/**
 * Generate comprehensive reports
 */
async function generateReports() {
  console.log('\n🚀 === COMPREHENSIVE REPORT GENERATION ===\n');
  
  ensureDir(REPORTS_DIR);
  ensureDir(OUTPUT_DIR);

  // Step 1: Run all test types with reports
  console.log('📊 Running all test suites with reporting...\n');
  
  const testCommands = [
    {
      command: 'npm run test:report',
      description: 'Unit and Integration Tests'
    },
    {
      command: 'npm run examples:basic:report',
      description: 'Basic Examples'
    },
    {
      command: 'npm run examples:auth:report',
      description: 'Authentication Examples'
    },
    {
      command: 'npm run examples:advanced:report',
      description: 'Advanced Examples'
    }
  ];

  let successCount = 0;
  for (const { command, description } of testCommands) {
    if (runCommand(command, description)) {
      successCount++;
    }
  }

  // Step 2: Find and merge all JSON reports
  console.log('\n📄 Merging JSON reports...');
  
  const jsonFiles = [];
  function findJsonFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findJsonFiles(fullPath);
      } else if (file.endsWith('.json') && !file.includes('execution')) {
        jsonFiles.push(fullPath);
      }
    });
  }

  findJsonFiles(REPORTS_DIR);
  console.log(`📋 Found ${jsonFiles.length} JSON report files`);

  if (jsonFiles.length > 0) {
    // Step 3: Merge reports using mochawesome-merge
    const mergeCommand = `npx mochawesome-merge "${jsonFiles.join('" "')}" -o "${path.join(OUTPUT_DIR, 'merged-report.json')}"`;
    if (runCommand(mergeCommand, 'Merging JSON reports')) {
      
      // Step 4: Generate final HTML report
      const generateCommand = `npx marge "${path.join(OUTPUT_DIR, 'merged-report.json')}" --reportDir "${OUTPUT_DIR}" --reportFilename "comprehensive-report" --charts --code --showPassed --showFailed --showPending --showSkipped`;
      runCommand(generateCommand, 'Generating comprehensive HTML report');
    }
  }

  // Step 5: Create CI/CD summary
  console.log('\n📋 Creating CI/CD summary...');
  
  const summary = {
    timestamp: new Date().toISOString(),
    framework: 'Restified TypeScript API Testing Framework',
    version: '1.0.0',
    execution: {
      totalSuites: testCommands.length,
      successfulSuites: successCount,
      failedSuites: testCommands.length - successCount
    },
    reports: {
      jsonFiles: jsonFiles.length,
      htmlGenerated: fs.existsSync(path.join(OUTPUT_DIR, 'comprehensive-report.html')),
      outputDirectory: OUTPUT_DIR
    },
    artifacts: {
      mergedJson: path.join(OUTPUT_DIR, 'merged-report.json'),
      comprehensiveHtml: path.join(OUTPUT_DIR, 'comprehensive-report.html'),
      executionSummary: path.join(REPORTS_DIR, 'execution-summary.json'),
      executionReport: path.join(REPORTS_DIR, 'execution-report.md')
    }
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'ci-cd-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  // Step 6: Create GitHub Actions / CI summary
  const ciSummary = `
# 🎯 Restified Test Execution Summary

| Metric | Value |
|--------|-------|
| **Framework** | Restified TypeScript API Testing Framework v1.0.0 |
| **Execution Time** | ${new Date().toISOString()} |
| **Test Suites** | ${successCount}/${testCommands.length} successful |
| **Reports Generated** | ${jsonFiles.length} JSON files |
| **HTML Report** | ${summary.reports.htmlGenerated ? '✅ Generated' : '❌ Failed'} |

## 📊 Report Artifacts

- 📄 **Comprehensive HTML Report**: \`${summary.artifacts.comprehensiveHtml}\`
- 📋 **Merged JSON Report**: \`${summary.artifacts.mergedJson}\`
- 📈 **Execution Summary**: \`${summary.artifacts.executionSummary}\`
- 📝 **Readable Report**: \`${summary.artifacts.executionReport}\`

## 🔧 Framework Configuration

- **Multiple HTTP Clients**: Pre-configured (api, testUtils, auth)
- **Global Authentication**: Automatic token management
- **Variable Management**: Global, local, and extracted variables
- **Response Store**: Caching and retrieval capabilities
- **Global Headers**: Automatic injection with override support
- **Error Handling**: Built-in retry logic and patterns

---
*Generated by Restified Report Generation Script*
`;

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'ci-summary.md'),
    ciSummary
  );

  // Final output
  console.log('\n✅ === REPORT GENERATION COMPLETE ===');
  console.log(`📁 Output Directory: ${OUTPUT_DIR}`);
  console.log(`📊 Test Suites: ${successCount}/${testCommands.length} successful`);
  console.log(`📄 JSON Reports: ${jsonFiles.length} files merged`);
  console.log(`🌐 HTML Report: ${summary.reports.htmlGenerated ? 'Generated' : 'Failed'}`);
  
  if (summary.reports.htmlGenerated) {
    console.log(`🎯 Open comprehensive report: ${path.join(OUTPUT_DIR, 'comprehensive-report.html')}`);
  }
  
  console.log('\n🚀 CI/CD Integration files:');
  console.log(`   📋 CI Summary: ${path.join(OUTPUT_DIR, 'ci-cd-summary.json')}`);
  console.log(`   📝 GitHub Actions Summary: ${path.join(OUTPUT_DIR, 'ci-summary.md')}`);
  console.log('');
}

// Run if called directly
if (require.main === module) {
  generateReports().catch(error => {
    console.error('❌ Report generation failed:', error);
    process.exit(1);
  });
}

module.exports = { generateReports };