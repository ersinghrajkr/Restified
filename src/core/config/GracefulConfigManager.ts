/**
 * Graceful Configuration Manager
 * 
 * Handles partial configurations and missing dependencies gracefully
 * without throwing errors, providing warnings and fallbacks instead.
 */

import chalk from 'chalk';

export interface GracefulConfig {
  enableWarnings: boolean;
  enableFallbacks: boolean;
  strictMode: boolean;
  silentFailures: string[]; // List of features to fail silently
  showHealthReport: boolean; // Whether to show the health report
  healthReportLevel: 'full' | 'summary' | 'errors-only'; // Level of detail in health report
}

export class GracefulConfigManager {
  private static instance: GracefulConfigManager;
  private gracefulConfig: GracefulConfig;
  private warnings: string[] = [];
  private missingFeatures: Set<string> = new Set();

  private constructor() {
    this.gracefulConfig = {
      enableWarnings: process.env.RESTIFIED_ENABLE_WARNINGS !== 'false',
      enableFallbacks: process.env.RESTIFIED_ENABLE_FALLBACKS !== 'false', 
      strictMode: process.env.RESTIFIED_STRICT_MODE === 'true',
      silentFailures: (process.env.RESTIFIED_SILENT_FAILURES || '').split(',').filter(Boolean),
      showHealthReport: process.env.RESTIFIED_SHOW_HEALTH_REPORT !== 'false',
      healthReportLevel: (process.env.RESTIFIED_HEALTH_REPORT_LEVEL as any) || 'full'
    };
  }

  public static getInstance(): GracefulConfigManager {
    if (!GracefulConfigManager.instance) {
      GracefulConfigManager.instance = new GracefulConfigManager();
    }
    return GracefulConfigManager.instance;
  }

  /**
   * Check if a feature is available and handle gracefully if not
   */
  checkFeatureAvailability(feature: string, packageName?: string, requirement?: string): boolean {
    try {
      if (packageName) {
        require(packageName);
      }
      return true;
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND' && packageName) {
        this.handleMissingPackage(feature, packageName, requirement);
      } else {
        this.handleMissingFeature(feature, error.message);
      }
      return false;
    }
  }

  /**
   * Handle missing package gracefully
   */
  private handleMissingPackage(feature: string, packageName: string, requirement?: string): void {
    const message = requirement || `npm install ${packageName}`;
    this.addWarning(`${feature} requires "${packageName}" package. Install with: ${message}`);
    this.missingFeatures.add(feature);
    
    if (this.gracefulConfig.strictMode && !this.gracefulConfig.silentFailures.includes(feature)) {
      throw new Error(`Missing required package for ${feature}: ${packageName}`);
    }
  }

  /**
   * Handle missing feature gracefully
   */
  private handleMissingFeature(feature: string, reason: string): void {
    this.addWarning(`${feature} is not available: ${reason}`);
    this.missingFeatures.add(feature);

    if (this.gracefulConfig.strictMode && !this.gracefulConfig.silentFailures.includes(feature)) {
      throw new Error(`Missing required feature: ${feature} - ${reason}`);
    }
  }

  /**
   * Add warning message
   */
  addWarning(message: string): void {
    if (this.gracefulConfig.enableWarnings) {
      this.warnings.push(message);
      console.warn(`⚠️ RestifiedTS Warning: ${message}`);
    }
  }

  /**
   * Check if feature is missing
   */
  isFeatureMissing(feature: string): boolean {
    return this.missingFeatures.has(feature);
  }

  /**
   * Get graceful fallback for missing client
   */
  getClientFallback(clientName: string, type: 'database' | 'graphql' | 'websocket'): any {
    if (!this.gracefulConfig.enableFallbacks) {
      return null;
    }

    const fallbackMessage = `${type} client '${clientName}' is not available. Check configuration and dependencies.`;
    this.addWarning(fallbackMessage);

    // Return proxy object that logs warnings instead of throwing errors
    return new Proxy({}, {
      get: (target, prop) => {
        this.addWarning(`Attempted to use unavailable ${type} client '${clientName}' method '${String(prop)}'`);
        return () => Promise.resolve({ 
          warning: `${type} client '${clientName}' is not available`,
          method: String(prop),
          success: false 
        });
      }
    });
  }

  /**
   * Validate configuration section gracefully
   */
  validateConfigSection(sectionName: string, config: any, required: string[] = []): boolean {
    if (!config) {
      if (required.length > 0) {
        this.addWarning(`Configuration section '${sectionName}' is missing but contains required settings: ${required.join(', ')}`);
        return false;
      }
      return true; // Optional section
    }

    const missing = required.filter(key => config[key] === undefined);
    if (missing.length > 0) {
      this.addWarning(`Configuration section '${sectionName}' is missing required settings: ${missing.join(', ')}`);
      return false;
    }

    return true;
  }

  /**
   * Get all warnings
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Get all missing features
   */
  getMissingFeatures(): string[] {
    return Array.from(this.missingFeatures);
  }

  /**
   * Clear warnings and missing features
   */
  clearWarnings(): void {
    this.warnings = [];
    this.missingFeatures.clear();
  }

  /**
   * Print configuration health report with enhanced formatting
   */
  printHealthReport(): void {
    // Check if health report is disabled
    if (!this.gracefulConfig.showHealthReport) {
      return;
    }

    // For errors-only mode, only show if there are actual errors
    if (this.gracefulConfig.healthReportLevel === 'errors-only' && this.missingFeatures.size === 0) {
      return;
    }

    console.log(chalk.cyan('\n🏥 RestifiedTS Configuration Health Report'));
    console.log(chalk.cyan('=========================================='));
    
    if (this.warnings.length === 0 && this.missingFeatures.size === 0) {
      console.log(chalk.green('✅ All configurations and dependencies are available'));
      console.log(chalk.green('🎉 Your RestifiedTS setup is perfect!'));
      console.log(chalk.cyan('==========================================\n'));
      return;
    }

    // For summary mode, show condensed information
    if (this.gracefulConfig.healthReportLevel === 'summary') {
      const totalIssues = this.warnings.length + this.missingFeatures.size;
      console.log(chalk.yellow(`⚠️ Found ${totalIssues} configuration notice(s)`));
      
      if (this.missingFeatures.size > 0) {
        console.log(chalk.red(`❌ ${this.missingFeatures.size} missing feature(s)`));
      }
      
      if (this.warnings.length > 0) {
        const optionalWarnings = this.warnings.filter(w => w.includes('optional') || w.includes('database') || w.includes('package'));
        console.log(chalk.yellow(`⚠️ ${optionalWarnings.length} optional feature(s) unavailable`));
      }
      
      console.log(chalk.gray('💡 Set RESTIFIED_HEALTH_REPORT_LEVEL=full for detailed information'));
      console.log(chalk.cyan('==========================================\n'));
      return;
    }

    // Categorize warnings for better display
    const databaseWarnings = this.warnings.filter(w => w.includes('database') || w.includes('DB') || w.includes('pg') || w.includes('mysql') || w.includes('mongodb') || w.includes('redis') || w.includes('sqlite'));
    const packageWarnings = this.warnings.filter(w => w.includes('package') || w.includes('npm install'));
    const configWarnings = this.warnings.filter(w => !databaseWarnings.includes(w) && !packageWarnings.includes(w));

    if (packageWarnings.length > 0) {
      console.log(chalk.yellow('\n📦 Optional Package Dependencies:'));
      packageWarnings.forEach(warning => {
        if (warning.includes('npm install')) {
          const packageName = warning.match(/npm install (\w+)/)?.[1];
          console.log(chalk.yellow(`   ⚠️  ${warning}`));
          console.log(chalk.gray(`      💡 This is optional - install only if you need this feature`));
        } else {
          console.log(chalk.yellow(`   ⚠️  ${warning}`));
        }
      });
    }

    if (databaseWarnings.length > 0) {
      console.log(chalk.blue('\n🗄️ Database Configuration:'));
      databaseWarnings.forEach(warning => {
        console.log(chalk.blue(`   ℹ️  ${warning}`));
        console.log(chalk.gray(`      💡 Database features are optional for API testing`));
      });
    }

    if (configWarnings.length > 0) {
      console.log(chalk.magenta('\n⚙️ Configuration Issues:'));
      configWarnings.forEach(warning => {
        console.log(chalk.magenta(`   ⚠️  ${warning}`));
      });
    }

    if (this.missingFeatures.size > 0) {
      console.log(chalk.red('\n❌ Missing Features:'));
      this.missingFeatures.forEach(feature => {
        console.log(chalk.red(`   ❌ ${feature}`));
        
        // Provide specific guidance for common features
        if (feature.includes('PostgreSQL')) {
          console.log(chalk.gray(`      💡 Install with: npm install pg @types/pg`));
        } else if (feature.includes('MySQL')) {
          console.log(chalk.gray(`      💡 Install with: npm install mysql2 @types/mysql2`));
        } else if (feature.includes('MongoDB')) {
          console.log(chalk.gray(`      💡 Install with: npm install mongodb @types/mongodb`));
        } else if (feature.includes('Redis')) {
          console.log(chalk.gray(`      💡 Install with: npm install redis @types/redis`));
        } else if (feature.includes('SQLite')) {
          console.log(chalk.gray(`      💡 Install with: npm install sqlite3 @types/sqlite3`));
        }
      });
    }

    console.log(chalk.gray('\n💡 RestifiedTS Guidance:'));
    console.log(chalk.gray('   • RestifiedTS will continue to work with available features'));
    console.log(chalk.gray('   • Database packages are optional for API testing'));
    console.log(chalk.gray('   • Set RESTIFIED_STRICT_MODE=true to make missing features throw errors'));
    console.log(chalk.gray('   • Use restified.config.ts to customize your setup'));
    
    console.log(chalk.cyan('==========================================\n'));
  }

  /**
   * Update graceful configuration
   */
  updateGracefulConfig(updates: Partial<GracefulConfig>): void {
    this.gracefulConfig = { ...this.gracefulConfig, ...updates };
  }

  /**
   * Get current graceful configuration
   */
  getGracefulConfig(): GracefulConfig {
    return { ...this.gracefulConfig };
  }
}

export const gracefulConfigManager = GracefulConfigManager.getInstance();