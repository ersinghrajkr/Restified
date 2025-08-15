/**
 * Restified HTML Reporter - JavaScript Wrapper
 */

require('ts-node/register');
const { RestifiedHtmlReporter } = require('./restified-html-reporter.ts');
const path = require('path');

function RestifiedReporter(runner) {
    RestifiedHtmlReporter.reset();

    // Track test execution times
    runner.on('test', function(test) {
        test.startTime = Date.now();
    });

    // Track hook execution times
    runner.on('hook', function(hook) {
        hook.startTime = Date.now();
    });

    // Handle test completion
    runner.on('test end', function(test) {
        const duration = Date.now() - test.startTime;
        
        const requestData = test.ctx && test.ctx.requestData;
        const responseData = test.ctx && test.ctx.responseData;
        const assertions = test.ctx && test.ctx.assertions;

        const testResult = {
            id: test.fullTitle(),
            title: test.fullTitle(),
            status: test.state || 'pending',
            duration: duration,
            error: test.err ? test.err.message : null,
            request: requestData,
            response: responseData,
            assertions: assertions
        };

        RestifiedHtmlReporter.addTest(testResult);
    });

    // Handle hook completion (setup/teardown)
    runner.on('hook end', function(hook) {
        const duration = Date.now() - hook.startTime;
        
        
        // Capture all hooks with titles (including global ones)
        if (hook.title) {
            let hookTitle = hook.title;
            
            // Clean up hook titles
            if (hookTitle.startsWith('"') && hookTitle.endsWith('"')) {
                hookTitle = hookTitle.slice(1, -1);
            } else if (hookTitle.startsWith('"') && !hookTitle.endsWith('"')) {
                // Handle malformed quotes like 'after all" hook in "{root}'
                hookTitle = hookTitle.replace(/^"/, '').replace(/" hook in ".*$/, '');
            }
            
            // Clean up common patterns and extract meaningful names
            if (hookTitle.includes('hook:')) {
                // Extract named hook: '"before all" hook: global setup hook'
                hookTitle = hookTitle.split('hook:')[1]
                    .replace(/\s+for\s+["'].*$/, '')  // Remove "for "test name"" or 'for "test name"'
                    .trim();
            } else {
                // For unnamed hooks, just get the hook type
                if (hookTitle.includes('"before all"')) {
                    hookTitle = 'Global Setup';
                } else if (hookTitle.includes('"after all"')) {
                    hookTitle = 'Global Cleanup';
                } else if (hookTitle.includes('"before each"')) {
                    hookTitle = 'Test Setup';
                } else if (hookTitle.includes('"after each"')) {
                    hookTitle = 'Test Cleanup';
                } else {
                    hookTitle = hookTitle
                        .replace(/^"(before|after)\s+(all|each)"\s+hook:\s*/, '')
                        .replace(/\s+for\s+".*"$/, '')  // Remove "for "test name""
                        .replace(/ hook$/, '')
                        .replace(/^"/, '')
                        .replace(/"$/, '')
                        .trim();
                }
            }
            
            
            // Skip empty or meaningless hooks but keep setup/teardown ones
            if (hookTitle && 
                !hookTitle.includes('should') && 
                !hookTitle.includes('it ') &&
                hookTitle.length > 0) {
                // Determine hook type from title
                let detectedHookType = 'unknown';
                if (hook.title.includes('"before all"')) {
                    detectedHookType = 'before';
                } else if (hook.title.includes('"after all"')) {
                    detectedHookType = 'after';
                } else if (hook.title.includes('"before each"')) {
                    detectedHookType = 'beforeEach';
                } else if (hook.title.includes('"after each"')) {
                    detectedHookType = 'afterEach';
                }

                // Extract hook function code
                let hookCode = 'Code not available';
                try {
                    if (hook.fn && typeof hook.fn === 'function') {
                        hookCode = hook.fn.toString();
                        // Clean up the code formatting
                        hookCode = hookCode
                            .replace(/^function\s*\([^)]*\)\s*\{/, '') // Remove function signature
                            .replace(/\}$/, '') // Remove closing brace
                            .split('\n')
                            .map(line => line.replace(/^    /, '')) // Remove common indentation
                            .join('\n')
                            .trim();
                    }
                } catch (error) {
                    hookCode = 'Unable to extract code: ' + error.message;
                }

                const hookResult = {
                    id: `${hook.parent ? hook.parent.fullTitle() : 'Global'} - ${hookTitle}`,
                    title: `🔧 ${hookTitle} (${hook.parent ? hook.parent.title || 'Global Suite' : 'Global'})`,
                    status: hook.state || (hook.err ? 'failed' : 'passed'),
                    duration: duration,
                    error: hook.err ? hook.err.message : null,
                    request: null,
                    response: null,
                    assertions: null,
                    isHook: true,
                    hookType: detectedHookType,
                    hookCode: hookCode
                };

                RestifiedHtmlReporter.addTest(hookResult);
            }
        }
    });

    runner.once('end', function() {
        console.log('\n🚀 Generating Restified HTML Report...');
        
        // Try to get configuration from environment or config file
        let configuredPath = null;
        try {
            // Load environment variables
            require('dotenv').config({ path: '.env.enterprise' });
            
            // Try to get reporting config
            const fs = require('fs');
            const path = require('path');
            
            let reportingConfig = {};
            
            // Try to load from restified.config.ts if it exists
            if (fs.existsSync('restified.config.ts')) {
                try {
                    const configModule = require('../../restified.config.ts');
                    reportingConfig = configModule.default?.reporting || {};
                } catch (e) {
                    // Fallback to reading from environment
                }
            }
            
            // Configure the reporter with environment variables and config
            const finalConfig = {
                title: process.env.REPORT_TITLE || reportingConfig.title || 'Restified Test Report',
                subtitle: process.env.REPORT_SUBTITLE || reportingConfig.subtitle || '',
                filename: process.env.REPORT_FILENAME || reportingConfig.filename || 'restified-html-report.html',
                outputDir: process.env.REPORT_OUTPUT_DIR || reportingConfig.outputDir || 'reports'
            };
            
            RestifiedHtmlReporter.configure(finalConfig);
            configuredPath = path.join(finalConfig.outputDir, finalConfig.filename);
            
            console.log(`📊 Using report configuration:`)
            console.log(`   Title: ${finalConfig.title}`);
            console.log(`   Subtitle: ${finalConfig.subtitle}`);
            console.log(`   Output: ${configuredPath}`);
            
        } catch (error) {
            console.warn('⚠️  Could not load reporting configuration, using defaults');
            // Fallback configuration
            configuredPath = path.join(process.env.REPORT_OUTPUT_DIR || 'reports', 
                                     process.env.REPORT_FILENAME || 'restified-html-report.html');
        }
        
        // Use the configured path, or let the reporter use its own defaults
        RestifiedHtmlReporter.generateReport(configuredPath);
    });
}

module.exports = RestifiedReporter;