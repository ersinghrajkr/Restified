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
        
        // Only capture hooks with meaningful names (not internal mocha hooks)
        if (hook.title && !hook.title.startsWith('"')) {
            const hookResult = {
                id: `${hook.parent ? hook.parent.fullTitle() : 'Global'} - ${hook.title}`,
                title: `🔧 ${hook.title} (${hook.parent ? hook.parent.title : 'Global'})`,
                status: hook.state || (hook.err ? 'failed' : 'passed'),
                duration: duration,
                error: hook.err ? hook.err.message : null,
                request: null,
                response: null,
                assertions: null,
                isHook: true
            };

            RestifiedHtmlReporter.addTest(hookResult);
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