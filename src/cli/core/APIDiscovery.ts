/**
 * API Discovery System
 * 
 * Automatically analyzes APIs and generates intelligent test strategies
 */

import axios from 'axios';
import * as yaml from 'yaml';

export interface APIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
  security?: any[];
  tags?: string[];
}

export interface APIResource {
  name: string;
  endpoints: APIEndpoint[];
  description?: string;
}

export interface APIAnalysis {
  openApiSpec?: any;
  endpoints: APIEndpoint[];
  resources: APIResource[];
  authMethod?: 'jwt' | 'oauth2' | 'basic' | 'apikey' | 'none';
  hasAuthEndpoints: boolean;
  hasCrudOperations: boolean;
  hasWebSockets: boolean;
  hasGraphQL: boolean;
  suggestedTestTypes: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  recommendations: string[];
}

export class APIDiscovery {
  private readonly commonSpecPaths = [
    '/swagger.json',
    '/swagger.yaml',
    '/openapi.json',
    '/openapi.yaml',
    '/api-docs',
    '/api-docs/swagger.json',
    '/docs/swagger.json',
    '/v1/swagger.json',
    '/v2/swagger.json',
    '/v3/swagger.json'
  ];

  /**
   * Analyze an API and return comprehensive information
   */
  async analyzeAPI(baseUrl: string): Promise<APIAnalysis> {
    const analysis: APIAnalysis = {
      endpoints: [],
      resources: [],
      hasAuthEndpoints: false,
      hasCrudOperations: false,
      hasWebSockets: false,
      hasGraphQL: false,
      suggestedTestTypes: ['api'], // Always include basic API testing
      complexity: 'simple',
      recommendations: []
    };

    try {
      // Try to find OpenAPI specification
      const spec = await this.findOpenAPISpec(baseUrl);
      
      if (spec) {
        analysis.openApiSpec = spec;
        this.analyzeOpenAPISpec(spec, analysis);
      } else {
        // Fallback: analyze endpoints through discovery
        await this.analyzeEndpointsHeuristically(baseUrl, analysis);
      }

      // Determine complexity and generate recommendations
      this.assessComplexity(analysis);
      this.generateRecommendations(analysis);

    } catch (error) {
      console.warn('API Discovery failed:', (error as Error).message);
      // Return basic analysis even if discovery fails
      analysis.recommendations.push('Manual configuration recommended - API discovery failed');
    }

    return analysis;
  }

  /**
   * Find OpenAPI specification
   */
  private async findOpenAPISpec(baseUrl: string): Promise<any | null> {
    for (const path of this.commonSpecPaths) {
      try {
        const url = new URL(path, baseUrl).toString();
        const response = await axios.get(url, { 
          timeout: 10000,
          validateStatus: (status) => status === 200
        });

        // Try to parse as JSON first, then YAML
        let spec;
        if (typeof response.data === 'object') {
          spec = response.data;
        } else if (typeof response.data === 'string') {
          try {
            spec = JSON.parse(response.data);
          } catch {
            spec = yaml.parse(response.data);
          }
        }

        // Validate it's an OpenAPI spec
        if (spec && (spec.openapi || spec.swagger)) {
          console.log(`✅ Found OpenAPI spec at: ${url}`);
          return spec;
        }
      } catch {
        // Continue to next path
      }
    }

    return null;
  }

  /**
   * Analyze OpenAPI specification
   */
  private analyzeOpenAPISpec(spec: any, analysis: APIAnalysis): void {
    const paths = spec.paths || {};
    
    // Extract endpoints
    for (const [path, pathObj] of Object.entries(paths)) {
      for (const [method, methodObj] of Object.entries(pathObj as any)) {
        if (typeof methodObj === 'object' && methodObj !== null) {
          const methodDetails = methodObj as any;
          const endpoint: APIEndpoint = {
            path,
            method: method.toUpperCase(),
            summary: methodDetails.summary,
            description: methodDetails.description,
            parameters: methodDetails.parameters,
            requestBody: methodDetails.requestBody,
            responses: methodDetails.responses,
            security: methodDetails.security,
            tags: methodDetails.tags
          };
          
          analysis.endpoints.push(endpoint);
        }
      }
    }

    // Group endpoints by resource/tag
    this.groupEndpointsByResource(analysis);

    // Analyze authentication
    this.analyzeAuthentication(spec, analysis);

    // Analyze API patterns
    this.analyzeAPIPatterns(analysis);
  }

  /**
   * Analyze endpoints heuristically when no OpenAPI spec is available
   */
  private async analyzeEndpointsHeuristically(baseUrl: string, analysis: APIAnalysis): Promise<void> {
    // Common endpoint patterns to check
    const commonPaths = [
      '/users',
      '/user',
      '/auth',
      '/login',
      '/token',
      '/api/users',
      '/api/auth',
      '/health',
      '/status',
      '/graphql',
      '/ws',
      '/websocket'
    ];

    for (const path of commonPaths) {
      try {
        const url = new URL(path, baseUrl).toString();
        
        // Try HEAD request first (less intrusive)
        const response = await axios.head(url, { 
          timeout: 5000,
          validateStatus: (status) => status < 500 // Accept any non-server error
        });

        if (response.status < 400) {
          const endpoint: APIEndpoint = {
            path,
            method: 'GET', // Assume GET for discovered endpoints
            summary: `Discovered endpoint: ${path}`
          };
          
          analysis.endpoints.push(endpoint);

          // Infer functionality from path
          if (path.includes('auth') || path.includes('login') || path.includes('token')) {
            analysis.hasAuthEndpoints = true;
          }
          
          if (path.includes('graphql')) {
            analysis.hasGraphQL = true;
          }
          
          if (path.includes('ws') || path.includes('websocket')) {
            analysis.hasWebSockets = true;
          }
        }
      } catch {
        // Continue to next path
      }
    }

    // Group discovered endpoints
    this.groupEndpointsByResource(analysis);
  }

  /**
   * Group endpoints by resource/functionality
   */
  private groupEndpointsByResource(analysis: APIAnalysis): void {
    const resourceMap = new Map<string, APIEndpoint[]>();

    for (const endpoint of analysis.endpoints) {
      // Use first tag if available, otherwise infer from path
      let resourceName = 'default';
      
      if (endpoint.tags && endpoint.tags.length > 0) {
        resourceName = endpoint.tags[0];
      } else {
        // Infer from path (e.g., /users/123 -> users)
        const pathParts = endpoint.path.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          resourceName = pathParts[0].replace(/[{}]/g, ''); // Remove path parameters
        }
      }

      if (!resourceMap.has(resourceName)) {
        resourceMap.set(resourceName, []);
      }
      resourceMap.get(resourceName)!.push(endpoint);
    }

    // Convert to resources array
    for (const [name, endpoints] of resourceMap) {
      analysis.resources.push({
        name,
        endpoints,
        description: `${endpoints.length} endpoints for ${name}`
      });
    }
  }

  /**
   * Analyze authentication methods
   */
  private analyzeAuthentication(spec: any, analysis: APIAnalysis): void {
    const securitySchemes = spec.components?.securitySchemes || spec.securityDefinitions || {};
    
    for (const [name, scheme] of Object.entries(securitySchemes)) {
      const schemeObj = scheme as any;
      
      switch (schemeObj.type) {
        case 'http':
          if (schemeObj.scheme === 'bearer') {
            analysis.authMethod = 'jwt';
          } else if (schemeObj.scheme === 'basic') {
            analysis.authMethod = 'basic';
          }
          break;
        case 'oauth2':
          analysis.authMethod = 'oauth2';
          break;
        case 'apiKey':
          analysis.authMethod = 'apikey';
          break;
      }
    }

    // Check if any endpoints require authentication
    analysis.hasAuthEndpoints = analysis.endpoints.some(endpoint => 
      endpoint.security && endpoint.security.length > 0
    );
  }

  /**
   * Analyze API patterns to determine complexity and features
   */
  private analyzeAPIPatterns(analysis: APIAnalysis): void {
    const methods = new Set(analysis.endpoints.map(e => e.method));
    
    // Check for CRUD operations
    analysis.hasCrudOperations = methods.has('POST') && methods.has('PUT') && methods.has('DELETE');

    // Check for WebSocket endpoints
    analysis.hasWebSockets = analysis.endpoints.some(e => 
      e.path.includes('ws') || e.path.includes('websocket')
    );

    // Check for GraphQL
    analysis.hasGraphQL = analysis.endpoints.some(e => 
      e.path.includes('graphql')
    );

    // Suggest test types based on patterns
    if (analysis.hasAuthEndpoints) {
      analysis.suggestedTestTypes.push('auth');
    }
    
    if (analysis.hasCrudOperations) {
      analysis.suggestedTestTypes.push('database');
    }
    
    if (analysis.endpoints.length > 20) {
      analysis.suggestedTestTypes.push('performance');
    }
    
    if (analysis.hasAuthEndpoints || analysis.endpoints.length > 10) {
      analysis.suggestedTestTypes.push('security');
    }
    
    if (analysis.hasGraphQL) {
      analysis.suggestedTestTypes.push('graphql');
    }
    
    if (analysis.hasWebSockets) {
      analysis.suggestedTestTypes.push('websocket');
    }
  }

  /**
   * Assess API complexity
   */
  private assessComplexity(analysis: APIAnalysis): void {
    let complexityScore = 0;

    // Base score from endpoint count
    complexityScore += Math.min(analysis.endpoints.length / 5, 10);

    // Authentication adds complexity
    if (analysis.hasAuthEndpoints) complexityScore += 3;

    // CRUD operations add complexity
    if (analysis.hasCrudOperations) complexityScore += 2;

    // Multiple resources add complexity
    complexityScore += Math.min(analysis.resources.length, 5);

    // Special protocols add complexity
    if (analysis.hasGraphQL) complexityScore += 2;
    if (analysis.hasWebSockets) complexityScore += 2;

    if (complexityScore <= 5) {
      analysis.complexity = 'simple';
    } else if (complexityScore <= 12) {
      analysis.complexity = 'moderate';
    } else {
      analysis.complexity = 'complex';
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(analysis: APIAnalysis): void {
    const recommendations: string[] = [];

    if (analysis.endpoints.length === 0) {
      recommendations.push('No endpoints discovered. Manual configuration required.');
      return;
    }

    if (analysis.complexity === 'simple') {
      recommendations.push('Simple API detected. Basic testing setup recommended.');
    } else if (analysis.complexity === 'moderate') {
      recommendations.push('Moderate complexity API. Consider performance and security testing.');
    } else {
      recommendations.push('Complex API detected. Comprehensive testing strategy recommended.');
    }

    if (analysis.hasAuthEndpoints && !analysis.authMethod) {
      recommendations.push('Authentication detected but method unclear. Manual auth configuration needed.');
    }

    if (analysis.endpoints.length > 50) {
      recommendations.push('Large API detected. Consider test prioritization and parallel execution.');
    }

    if (analysis.hasCrudOperations && !analysis.suggestedTestTypes.includes('database')) {
      recommendations.push('CRUD operations detected. Database testing highly recommended.');
    }

    if (analysis.resources.length > 10) {
      recommendations.push('Multiple resources detected. Consider organizing tests by resource.');
    }

    analysis.recommendations = recommendations;
  }

  /**
   * Generate test files based on discovered API structure
   */
  async generateTestsFromDiscovery(analysis: APIAnalysis): Promise<Map<string, string>> {
    const generatedTests = new Map<string, string>();

    // Generate resource-based test files
    for (const resource of analysis.resources) {
      const testContent = this.generateResourceTests(resource, analysis);
      generatedTests.set(`${resource.name}-tests.ts`, testContent);
    }

    return generatedTests;
  }

  /**
   * Generate test content for a specific resource
   */
  private generateResourceTests(resource: APIResource, analysis: APIAnalysis): string {
    const authSetup = analysis.authMethod ? this.generateAuthSetup(analysis.authMethod) : '';
    
    let testContent = `/**
 * ${resource.name} API Tests
 * Auto-generated from API discovery
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${resource.name} API Tests', function() {
  this.timeout(30000);

  ${authSetup}

  after(async function() {
    await restified.cleanup();
  });

`;

    // Generate tests for each endpoint
    for (const endpoint of resource.endpoints) {
      testContent += this.generateEndpointTest(endpoint);
    }

    testContent += '});';
    
    return testContent;
  }

  /**
   * Generate authentication setup code
   */
  private generateAuthSetup(authMethod: string): string {
    switch (authMethod) {
      case 'jwt':
        return `
  before(async function() {
    // JWT authentication will be handled by global setup
    console.log('Using JWT authentication from global setup');
  });`;
      case 'basic':
        return `
  before(async function() {
    // Basic auth setup
    restified.setGlobalVariable('authUsername', process.env.AUTH_USERNAME || 'admin');
    restified.setGlobalVariable('authPassword', process.env.AUTH_PASSWORD || 'password');
  });`;
      case 'apikey':
        return `
  before(async function() {
    // API Key setup
    restified.setGlobalVariable('apiKey', process.env.API_KEY || 'your-api-key');
  });`;
      default:
        return '';
    }
  }

  /**
   * Generate test for a specific endpoint
   */
  private generateEndpointTest(endpoint: APIEndpoint): string {
    const testName = `should ${endpoint.method.toLowerCase()} ${endpoint.path}`;
    const pathWithoutParams = endpoint.path.replace(/{[^}]+}/g, '1'); // Replace {id} with 1
    
    let testBody = '';
    
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      testBody = `
          .body({
            // TODO: Add appropriate request body based on your API schema
            name: 'Test Item',
            description: 'Auto-generated test data'
          })`;
    }

    return `
  it('${testName}', async function() {
    const response = await restified
      .given()
        .useClient('api')${testBody}
      .when()
        .${endpoint.method.toLowerCase()}('${pathWithoutParams}')
        .execute();

    await response
      .statusCode(${this.getExpectedStatusCode(endpoint.method)})
      .execute();
  });
`;
  }

  /**
   * Get expected status code based on HTTP method
   */
  private getExpectedStatusCode(method: string): number {
    switch (method) {
      case 'POST': return 201;
      case 'DELETE': return 204;
      default: return 200;
    }
  }
}