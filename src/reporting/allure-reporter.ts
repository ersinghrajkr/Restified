/**
 * Allure Reporter Integration for Restified
 * 
 * This provides native request/response attachment support with Allure reports
 */

import { HttpResponse } from '../RestifiedTypes';

// Allure integration
let allure: any = null;
try {
  allure = require('allure-js-commons');
} catch (error) {
  // Allure not available
}

export class AllureReporter {
  /**
   * Add request details to Allure report
   */
  static addRequest(request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  }): void {
    if (!allure) return;

    try {
      // Add request as attachment
      allure.attachment('Request Details', JSON.stringify({
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        timestamp: new Date().toISOString()
      }, null, 2), 'application/json');

      // Add individual request parameters
      allure.parameter('HTTP Method', request.method);
      allure.parameter('URL', request.url);
      
      if (request.body) {
        allure.attachment('Request Body', JSON.stringify(request.body, null, 2), 'application/json');
      }

      if (Object.keys(request.headers).length > 0) {
        allure.attachment('Request Headers', JSON.stringify(request.headers, null, 2), 'application/json');
      }

    } catch (error) {
      console.warn('Failed to add request to Allure report:', error);
    }
  }

  /**
   * Add response details to Allure report
   */
  static addResponse(response: HttpResponse): void {
    if (!allure) return;

    try {
      // Add response as attachment
      allure.attachment('Response Details', JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.data,
        responseTime: response.responseTime,
        timestamp: new Date().toISOString()
      }, null, 2), 'application/json');

      // Add response parameters
      allure.parameter('Status Code', response.status.toString());
      allure.parameter('Response Time', `${response.responseTime}ms`);

      // Add response body as attachment
      if (response.data) {
        const contentType = response.headers['content-type'] || 'application/json';
        allure.attachment('Response Body', 
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2), 
          contentType
        );
      }

      // Add response headers as attachment
      if (response.headers && Object.keys(response.headers).length > 0) {
        allure.attachment('Response Headers', JSON.stringify(response.headers, null, 2), 'application/json');
      }

    } catch (error) {
      console.warn('Failed to add response to Allure report:', error);
    }
  }

  /**
   * Add test step
   */
  static addStep(stepName: string, status: 'passed' | 'failed' | 'broken' | 'skipped' = 'passed'): void {
    if (!allure) return;

    try {
      allure.step(stepName, () => {
        // Step implementation can be added here
      });
    } catch (error) {
      console.warn('Failed to add step to Allure report:', error);
    }
  }

  /**
   * Add test environment info
   */
  static addEnvironmentInfo(info: Record<string, string>): void {
    if (!allure) return;

    try {
      Object.entries(info).forEach(([key, value]) => {
        allure.parameter(key, value);
      });
    } catch (error) {
      console.warn('Failed to add environment info to Allure report:', error);
    }
  }
}