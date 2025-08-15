/**
 * Graceful Configuration Manager
 * 
 * Handles partial configurations and missing dependencies gracefully
 * without throwing errors, providing warnings and fallbacks instead.
 */

export interface GracefulConfig {
  enableWarnings: boolean;
  enableFallbacks: boolean;
  strictMode: boolean;
  silentFailures: string[]; // List of features to fail silently
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
      silentFailures: (process.env.RESTIFIED_SILENT_FAILURES || '').split(',').filter(Boolean)
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
   * Print configuration health report
   */
  printHealthReport(): void {
    console.log('\n🏥 RestifiedTS Configuration Health Report');
    console.log('==========================================');
    
    if (this.warnings.length === 0 && this.missingFeatures.size === 0) {
      console.log('✅ All configurations and dependencies are available');
      return;
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ Configuration Warnings:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (this.missingFeatures.size > 0) {
      console.log('\n❌ Missing Features:');
      this.missingFeatures.forEach(feature => console.log(`   - ${feature}`));
    }

    console.log('\n💡 Note: RestifiedTS will continue to work with available features.');
    console.log('   Set RESTIFIED_STRICT_MODE=true to make missing features throw errors.');
    console.log('==========================================\n');
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