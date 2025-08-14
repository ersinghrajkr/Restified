/**
 * Restified HTML Reporter - JavaScript Wrapper
 */

require('ts-node/register');
const { RestifiedHtmlReporter } = require('./restified-html-reporter.ts');

function RestifiedReporter(runner) {
    RestifiedHtmlReporter.reset();

    runner.on('test', function(test) {
        test.startTime = Date.now();
    });

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

    runner.once('end', function() {
        console.log('\n🚀 Generating Restified HTML Report...');
        RestifiedHtmlReporter.generateReport('reports/restified-html-report.html');
    });
}

module.exports = RestifiedReporter;