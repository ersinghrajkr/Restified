/**
 * CLI Command: Generate Test Reports
 * 
 * Simple command for end users to generate beautiful HTML test reports
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export const reportCommand = new Command('report')
  .description('Generate beautiful HTML test reports')
  .option('-o, --open', 'Open the report in browser after generation')
  .option('--clean', 'Clean previous reports before generating new ones')
  .action(async (options) => {
    console.log(chalk.cyan('\n🚀 === Restified Report Generator ===\n'));

    try {
      const projectRoot = process.cwd();
      const reportsDir = path.join(projectRoot, 'reports');

      // Clean previous reports if requested
      if (options.clean) {
        console.log(chalk.yellow('🧹 Cleaning previous reports...'));
        try {
          if (fs.existsSync(reportsDir)) {
            fs.rmSync(reportsDir, { recursive: true, force: true });
          }
          console.log(chalk.green('✅ Previous reports cleaned'));
        } catch (error) {
          console.log(chalk.yellow('⚠️  Could not clean previous reports:', error.message));
        }
      }

      // Generate report with simple command
      console.log(chalk.blue('📊 Running tests and generating report...'));
      console.log(chalk.gray('   This may take a moment...\n'));

      const reportCommand = `npm run examples -- --reporter mochawesome --reporter-options reportDir=reports,reportFilename=test-report,html=true,json=true,overwrite=true,charts=true,code=true`;
      
      try {
        execSync(reportCommand, { 
          stdio: 'inherit',
          cwd: projectRoot,
          env: { ...process.env, GENERATE_REPORTS: 'true' }
        });
      } catch (error) {
        // Tests might fail but report should still be generated
        console.log(chalk.yellow('\n⚠️  Some tests may have failed, but report was still generated'));
      }

      // Check if report was generated
      const htmlReportPath = path.join(reportsDir, 'test-report.html');
      if (fs.existsSync(htmlReportPath)) {
        console.log(chalk.green('\n✅ === Report Generation Complete ==='));
        console.log(chalk.white('📁 Report Location:'), chalk.cyan(htmlReportPath));
        console.log(chalk.white('📊 Summary:'), chalk.cyan(path.join(reportsDir, 'test-summary.json')));

        // Open report if requested
        if (options.open) {
          console.log(chalk.blue('\n🌐 Opening report in browser...'));
          try {
            const { exec } = require('child_process');
            const platform = process.platform;
            
            let openCommand;
            if (platform === 'win32') {
              openCommand = `start "${htmlReportPath}"`;
            } else if (platform === 'darwin') {
              openCommand = `open "${htmlReportPath}"`;
            } else {
              openCommand = `xdg-open "${htmlReportPath}"`;
            }
            
            exec(openCommand);
            console.log(chalk.green('✅ Report opened in browser'));
          } catch (error) {
            console.log(chalk.yellow('⚠️  Could not open browser automatically'));
            console.log(chalk.white('💡 Manually open:'), chalk.cyan(htmlReportPath));
          }
        } else {
          console.log(chalk.white('\n💡 To view report, open:'), chalk.cyan(htmlReportPath));
          console.log(chalk.gray('   Or run: restifiedts report --open'));
        }

        // Show quick stats
        try {
          const summaryPath = path.join(reportsDir, 'test-summary.json');
          if (fs.existsSync(summaryPath)) {
            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            console.log(chalk.white('\n📈 Quick Stats:'));
            console.log(chalk.white('   Duration:'), chalk.cyan(summary.duration));
            console.log(chalk.white('   Environment:'), chalk.cyan(summary.environment));
            console.log(chalk.white('   Authentication:'), summary.authentication.status === 'success' ? chalk.green('✅ Success') : chalk.red('❌ Failed'));
          }
        } catch (error) {
          // Ignore summary reading errors
        }

      } else {
        console.log(chalk.red('\n❌ Report generation failed'));
        console.log(chalk.white('💡 Try running:'), chalk.cyan('npm run examples'));
        console.log(chalk.white('   Then manually run:'), chalk.cyan('npm run report'));
      }

    } catch (error) {
      console.log(chalk.red('\n❌ Error generating report:'), error.message);
      console.log(chalk.white('\n💡 Troubleshooting:'));
      console.log(chalk.gray('   1. Make sure you\'re in a Restified project directory'));
      console.log(chalk.gray('   2. Run: npm install'));
      console.log(chalk.gray('   3. Try: npm run examples'));
      throw error; // Re-throw instead of process.exit
    }
  });

// Helper function to check if we're in a Restified project
function isRestifiedProject(): boolean {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.name === 'restified' || 
             (packageJson.dependencies && packageJson.dependencies.restified) ||
             (packageJson.devDependencies && packageJson.devDependencies.restified);
    }
    return false;
  } catch {
    return false;
  }
}