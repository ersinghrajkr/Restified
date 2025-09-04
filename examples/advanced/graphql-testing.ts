/**
 * GraphQL Testing Examples with RestifiedTS
 * 
 * Demonstrates comprehensive GraphQL query and mutation testing
 */

import { restified } from '../../src/index';
import { expect } from 'chai';

describe('GraphQL API Testing', function() {
  this.timeout(30000);

  before(async function() {
    // Create GraphQL client
    restified.createGraphQLClient('github', {
      endpoint: 'https://api.github.com/graphql',
      headers: {
        'Authorization': 'Bearer {{$env.GITHUB_TOKEN}}',
        'User-Agent': 'RestifiedTS-GraphQL-Test'
      },
      timeout: 15000
    });

    // Set test variables
    restified.setGlobalVariable('owner', 'facebook');
    restified.setGlobalVariable('repo', 'react');
  });

  after(async function() {
    await restified.cleanup();
  });

  describe('GraphQL Queries', function() {
    it('should execute basic repository query', async function() {
      const client = restified.getGraphQLClient('github');
      
      const query = `
        query GetRepository($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            name
            description
            stargazerCount
            forkCount
            language {
              name
            }
            owner {
              login
            }
          }
        }
      `;

      const response = await client.query(query, {
        owner: '{{owner}}',
        name: '{{repo}}'
      });

      // Validate GraphQL response structure
      expect(response.status).to.equal(200);
      expect(response.data.data).to.exist;
      expect(response.data.errors).to.not.exist;
      
      const repository = response.data.data.repository;
      expect(repository.name).to.equal('react');
      expect(repository.owner.login).to.equal('facebook');
      expect(repository.stargazerCount).to.be.a('number');
      expect(repository.stargazerCount).to.be.greaterThan(100000);

      // Extract repository data
      restified.setGlobalVariable('repoStars', repository.stargazerCount);
      restified.setGlobalVariable('repoDescription', repository.description);
    });

    it('should handle GraphQL variables and fragments', async function() {
      const client = restified.getGraphQLClient('github');
      
      const query = `
        fragment RepositoryInfo on Repository {
          name
          description
          stargazerCount
          issues(states: OPEN) {
            totalCount
          }
          pullRequests(states: OPEN) {
            totalCount
          }
        }

        query GetRepositoryDetails($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            ...RepositoryInfo
            languages(first: 5) {
              edges {
                node {
                  name
                }
                size
              }
            }
          }
        }
      `;

      const response = await client.query(query, {
        owner: '{{owner}}',
        name: '{{repo}}'
      });

      expect(response.status).to.equal(200);
      expect(response.data.data.repository.languages.edges).to.be.an('array');
      expect(response.data.data.repository.issues.totalCount).to.be.a('number');
      expect(response.data.data.repository.pullRequests.totalCount).to.be.a('number');
    });

    it('should validate GraphQL errors', async function() {
      const client = restified.getGraphQLClient('github');
      
      // Invalid query - missing required field
      const invalidQuery = `
        query InvalidQuery {
          repository {
            name
          }
        }
      `;

      const response = await client.query(invalidQuery);

      expect(response.status).to.equal(200); // GraphQL returns 200 even for errors
      expect(response.data.errors).to.exist;
      expect(response.data.errors).to.be.an('array');
      expect(response.data.errors[0].message).to.include('Field \'repository\' of type \'Repository\' must have a selection of subfields');
    });
  });

  describe('GraphQL Introspection', function() {
    it('should introspect GraphQL schema', async function() {
      const client = restified.getGraphQLClient('github');
      
      const response = await client.introspect();

      expect(response.status).to.equal(200);
      expect(response.data.data.__schema).to.exist;
      expect(response.data.data.__schema.types).to.be.an('array');
      expect(response.data.data.__schema.queryType.name).to.equal('Query');

      // Find Repository type
      const repositoryType = response.data.data.__schema.types.find(
        (type: any) => type.name === 'Repository'
      );
      expect(repositoryType).to.exist;
      expect(repositoryType.fields).to.be.an('array');
    });
  });

  describe('GraphQL Query Validation', function() {
    it('should validate query syntax', function() {
      const client = restified.getGraphQLClient('github');
      
      const validQuery = `
        query ValidQuery($owner: String!) {
          repository(owner: $owner, name: "react") {
            name
          }
        }
      `;

      const validation = client.validateQuery(validQuery);
      expect(validation.valid).to.be.true;
      expect(validation.errors).to.be.empty;
    });

    it('should detect invalid query syntax', function() {
      const client = restified.getGraphQLClient('github');
      
      const invalidQuery = `
        query InvalidQuery {
          repository(owner: $owner, name: "react" {
            name
          }
        }
      `;

      const validation = client.validateQuery(invalidQuery);
      expect(validation.valid).to.be.false;
      expect(validation.errors).to.not.be.empty;
    });
  });

  describe('Performance Testing', function() {
    it('should measure GraphQL query performance', async function() {
      const client = restified.getGraphQLClient('github');
      
      const startTime = Date.now();
      
      const query = `
        query QuickQuery {
          viewer {
            login
          }
        }
      `;

      const response = await client.query(query);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).to.equal(200);
      expect(duration).to.be.lessThan(5000); // Should complete within 5 seconds
      
      console.log(`GraphQL query completed in ${duration}ms`);
    });
  });
});