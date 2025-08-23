/**
 * Enhanced Create Command
 * 
 * AI-powered test suite creation with interactive wizard and API discovery
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { InteractiveWizard } from '../core/InteractiveWizard';
import { APIDiscovery } from '../core/APIDiscovery';
import { TestStrategyAnalyzer } from '../core/TestStrategyAnalyzer';
import { ScaffoldOrchestrator } from '../core/ScaffoldOrchestrator';
import { ScaffoldOptions } from '../types/ScaffoldTypes';

export const createCommand = new Command('create')
  .description('🧙‍♂️ AI-powered test suite creation with guided setup')
  .option('-i, --interactive', 'Launch interactive wizard (default)', true)
  .option('-q, --quick', 'Quick start with minimal questions')
  .option('--analyze-only', 'Only analyze API and show recommendations (no code generation)')
  .option('--url <url>', 'API URL to analyze')
  .option('--strategy', 'Show test strategy analysis')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('\n🚀 === RestifiedTS AI-Powered Suite Creator ===\n'));

      // API analysis mode
      if (options.analyzeOnly && options.url) {
        await runAPIAnalysisMode(options.url, options.strategy);
        return;
      }

      // Interactive wizard mode (default)
      const wizard = new InteractiveWizard();
      let scaffoldOptions: ScaffoldOptions;

      if (options.quick) {
        scaffoldOptions = await wizard.quickStart();
      } else {
        scaffoldOptions = await wizard.run();
      }

      // Create orchestrator and execute
      console.log(chalk.cyan('\n🔧 Generating your test suite...\n'));
      const orchestrator = new ScaffoldOrchestrator(scaffoldOptions);
      const result = await orchestrator.execute();

      if (result.success) {
        console.log(chalk.green(`\n🎉 ${result.message}`));
        
        // Show next steps
        console.log(chalk.cyan('\n🚀 Ready to test! Next steps:'));
        console.log(chalk.yellow(`   cd ${scaffoldOptions.output || scaffoldOptions.name}`));
        console.log(chalk.yellow('   cp .env.example .env'));
        console.log(chalk.yellow('   npm install'));
        console.log(chalk.yellow('   npm test'));
        
        // Show dashboard option
        console.log(chalk.cyan('\n📊 Want to see live test execution?'));
        console.log(chalk.yellow('   restifiedts test --dashboard'));
        
        process.exit(0);
      } else {
        console.log(chalk.red(`\n❌ ${result.message}`));
        process.exit(1);
      }

    } catch (error) {
      console.log(chalk.red(`\n❌ Creation failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

/**
 * Run API analysis mode without code generation
 */
async function runAPIAnalysisMode(apiUrl: string, showStrategy: boolean = false): Promise<void> {
  console.log(chalk.cyan('🔍 Analyzing API structure and generating recommendations...\n'));

  try {
    const discovery = new APIDiscovery();
    const analysis = await discovery.analyzeAPI(apiUrl);
    
    // Show basic analysis
    console.log(chalk.green('✅ API Analysis Complete!\n'));
    
    console.log(`📊 ${chalk.bold('API Overview')}:`);
    console.log(`   🌐 Base URL: ${chalk.cyan(apiUrl)}`);
    console.log(`   📡 Endpoints: ${chalk.yellow(analysis.endpoints.length.toString())}`);
    console.log(`   📋 Resources: ${chalk.yellow(analysis.resources.length.toString())}`);
    console.log(`   🔒 Auth Method: ${analysis.authMethod ? chalk.green(analysis.authMethod) : chalk.gray('none detected')}`);
    console.log(`   🏗️  Complexity: ${getComplexityColor(analysis.complexity)(analysis.complexity)}`);
    
    if (analysis.openApiSpec) {
      console.log(`   📄 OpenAPI Spec: ${chalk.green('✅ Found')}`);
    }

    // Show discovered resources
    if (analysis.resources.length > 0) {
      console.log(`\n📋 ${chalk.bold('Discovered Resources')}:`);
      analysis.resources.forEach(resource => {
        console.log(`   • ${chalk.cyan(resource.name)} (${resource.endpoints.length} endpoints)`);
      });
    }

    // Show suggested test types
    if (analysis.suggestedTestTypes.length > 0) {
      console.log(`\n🧪 ${chalk.bold('Recommended Test Types')}:`);
      analysis.suggestedTestTypes.forEach(type => {
        console.log(`   • ${chalk.green('✅')} ${type}`);
      });
    }

    // Show recommendations
    if (analysis.recommendations.length > 0) {
      console.log(`\n💡 ${chalk.bold('Recommendations')}:`);
      analysis.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Show strategy analysis if requested
    if (showStrategy) {
      console.log(chalk.cyan('\n🎯 Generating test strategy...\n'));
      
      const analyzer = new TestStrategyAnalyzer();
      const strategy = analyzer.analyzeTestStrategy(analysis);
      
      console.log(`📊 ${chalk.bold('Test Strategy Analysis')}:`);
      console.log(`   🎯 Priority: ${getPriorityColor(strategy.priority)(strategy.priority)}`);
      console.log(`   ⏱️  Estimated Effort: ${chalk.yellow(strategy.estimatedEffort.total.toString())} hours total`);
      console.log(`   📈 Coverage Targets:`);
      console.log(`      Functional: ${chalk.cyan(strategy.coverage.functional.toString())}%`);
      console.log(`      Performance: ${chalk.cyan(strategy.coverage.performance.toString())}%`);
      console.log(`      Security: ${chalk.cyan(strategy.coverage.security.toString())}%`);
      console.log(`      Integration: ${chalk.cyan(strategy.coverage.integration.toString())}%`);

      // Show risk areas
      if (strategy.riskAreas.length > 0) {
        console.log(`\n⚠️  ${chalk.bold('Risk Areas to Focus On')}:`);
        strategy.riskAreas.forEach(risk => {
          const riskColor = risk.risk === 'high' ? chalk.red : 
                           risk.risk === 'medium' ? chalk.yellow : chalk.green;
          console.log(`   • ${risk.area} - ${riskColor(risk.risk)} risk`);
          console.log(`     ${chalk.gray('Impact:')} ${risk.impact}, ${chalk.gray('Tests:')} ${risk.tests.length}`);
        });
      }

      // Show recommendations
      if (strategy.recommendations.length > 0) {
        console.log(`\n🎯 ${chalk.bold('Strategic Recommendations')}:`);
        strategy.recommendations.forEach(rec => {
          const priorityColor = rec.priority === 'high' ? chalk.red : 
                               rec.priority === 'medium' ? chalk.yellow : chalk.green;
          console.log(`   • ${chalk.bold(rec.title)} [${priorityColor(rec.priority)} priority]`);
          console.log(`     ${chalk.gray(rec.description)}`);
        });
      }
    }

    console.log(chalk.cyan('\n💡 Want to create a test suite? Run:'));
    console.log(chalk.yellow('   restifiedts create'));

  } catch (error) {
    console.log(chalk.red(`❌ API analysis failed: ${(error as Error).message}`));
    console.log(chalk.gray('Try checking the URL or network connection.'));
  }
}

/**
 * Get color for complexity level
 */
function getComplexityColor(complexity: string): (text: string) => string {
  switch (complexity) {
    case 'simple': return chalk.green;
    case 'moderate': return chalk.yellow;
    case 'complex': return chalk.red;
    default: return chalk.gray;
  }
}

/**
 * Get color for priority level
 */
function getPriorityColor(priority: string): (text: string) => string {
  switch (priority) {
    case 'low': return chalk.green;
    case 'medium': return chalk.yellow;
    case 'high': return chalk.yellow;
    case 'critical': return chalk.red;
    default: return chalk.gray;
  }
}

// Add help examples
createCommand.addHelpText('after', `
Examples:
  $ restifiedts create                           # Interactive wizard (recommended)
  $ restifiedts create --quick                   # Quick start with minimal questions
  $ restifiedts create --analyze-only --url https://api.example.com
  $ restifiedts create --analyze-only --url https://api.example.com --strategy

The create command offers:
  🧙‍♂️ Interactive wizard with smart defaults
  🔍 Automatic API discovery and analysis  
  🎯 AI-powered test strategy recommendations
  📊 Complexity analysis and effort estimation
  🚀 One-command setup for any API
`);