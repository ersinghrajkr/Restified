/**
 * JSON Fixture Testing Examples with RestifiedTS
 * 
 * Demonstrates comprehensive JSON fixture resolution with dynamic variables
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

describe('JSON Fixture Testing', function() {
  this.timeout(30000);

  before(async function() {
    // Setup test fixtures directory
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create sample fixture files
    const userFixture = {
      id: "{{userId}}",
      name: "{{$faker.person.fullName}}",
      email: "{{$faker.internet.email}}",
      age: "{{$random.number(18,65)}}",
      address: {
        street: "{{$faker.address.streetAddress}}",
        city: "{{$faker.address.city}}",
        country: "{{country}}",
        coordinates: {
          lat: "{{$faker.address.latitude}}",
          lng: "{{$faker.address.longitude}}"
        }
      },
      preferences: {
        theme: "{{userTheme}}",
        notifications: true,
        language: "{{$env.DEFAULT_LANGUAGE}}",
        metadata: {
          createdAt: "{{$date.now}}",
          version: "{{$util.guid}}",
          source: "restifiedts-test"
        }
      },
      tags: ["{{tag1}}", "{{tag2}}", "premium"]
    };

    const orderFixture = {
      orderId: "{{$random.uuid}}",
      customerId: "{{userId}}",
      items: [
        {
          productId: "{{productId1}}",
          name: "{{$faker.commerce.product}}",
          price: "{{$random.number(10,1000)}}",
          quantity: "{{quantity1}}"
        },
        {
          productId: "{{productId2}}",
          name: "{{$faker.commerce.product}}",
          price: "{{$random.number(10,1000)}}",
          quantity: "{{quantity2}}"
        }
      ],
      shipping: {
        address: "{{shippingAddress}}",
        method: "{{shippingMethod}}",
        trackingId: "{{$util.base64encode(track-{{$random.uuid}})}}"
      },
      payment: {
        method: "credit_card",
        cardLast4: "{{$random.number(1000,9999)}}",
        amount: "{{totalAmount}}",
        currency: "{{$env.DEFAULT_CURRENCY}}",
        transactionId: "{{$util.guid}}"
      },
      timestamps: {
        created: "{{$date.now}}",
        updated: "{{$date.now}}",
        estimatedDelivery: "{{deliveryDate}}"
      }
    };

    // Write fixtures to files
    fs.writeFileSync(
      path.join(fixturesDir, 'user.json'),
      JSON.stringify(userFixture, null, 2)
    );

    fs.writeFileSync(
      path.join(fixturesDir, 'order.json'),
      JSON.stringify(orderFixture, null, 2)
    );

    // Set up global variables
    restified.setGlobalVariables({
      userId: 'user-12345',
      country: 'United States',
      userTheme: 'dark',
      tag1: 'vip',
      tag2: 'beta-tester'
    });

    // Set up environment variables for testing
    process.env.DEFAULT_LANGUAGE = 'en-US';
    process.env.DEFAULT_CURRENCY = 'USD';
  });

  after(async function() {
    await restified.cleanup();
    // Cleanup fixtures
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('Basic JSON Variable Resolution', function() {
    it('should resolve simple variables in JSON objects', function() {
      const template = {
        userId: '{{userId}}',
        name: '{{userName}}',
        active: true,
        count: 42
      };

      restified.setLocalVariable('userName', 'John Doe');

      const resolved = restified.resolveVariables(template);

      expect(resolved.userId).to.equal('user-12345');
      expect(resolved.name).to.equal('John Doe');
      expect(resolved.active).to.be.true;
      expect(resolved.count).to.equal(42);
    });

    it('should resolve nested variables in complex objects', function() {
      const template = {
        user: {
          profile: {
            id: '{{userId}}',
            settings: {
              theme: '{{userTheme}}',
              lang: '{{$env.DEFAULT_LANGUAGE}}'
            }
          }
        },
        metadata: {
          timestamp: '{{$date.timestamp}}',
          uuid: '{{$random.uuid}}'
        }
      };

      const resolved = restified.resolveVariables(template);

      expect(resolved.user.profile.id).to.equal('user-12345');
      expect(resolved.user.profile.settings.theme).to.equal('dark');
      expect(resolved.user.profile.settings.lang).to.equal('en-US');
      expect(resolved.metadata.timestamp).to.be.a('string');
      expect(resolved.metadata.uuid).to.match(/^[0-9a-f-]+$/);
    });

    it('should resolve variables in arrays', function() {
      const template = {
        users: ['{{userId}}', '{{$random.uuid}}'],
        tags: ['{{tag1}}', '{{tag2}}', 'static-tag'],
        coordinates: ['{{$faker.address.latitude}}', '{{$faker.address.longitude}}']
      };

      const resolved = restified.resolveVariables(template);

      expect(resolved.users[0]).to.equal('user-12345');
      expect(resolved.users[1]).to.match(/^[0-9a-f-]+$/);
      expect(resolved.tags).to.deep.equal(['vip', 'beta-tester', 'static-tag']);
      expect(resolved.coordinates).to.have.length(2);
    });
  });

  describe('Built-in Function Resolution', function() {
    it('should resolve faker functions', function() {
      const template = {
        name: '{{$faker.person.fullName}}',
        email: '{{$faker.internet.email}}',
        product: '{{$faker.commerce.product}}'
      };

      const resolved = restified.resolveVariables(template);

      expect(resolved.name).to.be.a('string');
      expect(resolved.email).to.include('@');
      expect(resolved.product).to.be.a('string');
    });

    it('should resolve random utility functions', function() {
      const template = {
        uuid: '{{$random.uuid}}',
        number: '{{$random.number}}',
        rangeNumber: '{{$random.number(1,10)}}',
        string: '{{$random.string}}'
      };

      const resolved = restified.resolveVariables(template);

      expect(resolved.uuid).to.match(/^[0-9a-f-]+$/);
      expect(parseInt(resolved.number)).to.be.a('number');
      expect(parseInt(resolved.rangeNumber)).to.be.within(1, 10);
      expect(resolved.string).to.be.a('string');
    });

    it('should resolve date and utility functions', function() {
      const template = {
        now: '{{$date.now}}',
        timestamp: '{{$date.timestamp}}',
        today: '{{$date.today}}',
        guid: '{{$util.guid}}',
        encoded: '{{$util.base64encode(test-data)}}'
      };

      const resolved = restified.resolveVariables(template);

      expect(new Date(resolved.now)).to.be.a('date');
      expect(parseInt(resolved.timestamp)).to.be.a('number');
      expect(resolved.today).to.match(/^\d{4}-\d{2}-\d{2}$/);
      expect(resolved.guid).to.match(/^[0-9a-f-]+$/);
      expect(resolved.encoded).to.be.a('string');
    });
  });

  describe('JSON Fixture Loading', function() {
    it('should load and resolve user fixture', function() {
      const fixturePath = path.join(__dirname, 'fixtures', 'user.json');
      const userData = restified.loadJsonFixture(fixturePath);

      expect(userData.id).to.equal('user-12345');
      expect(userData.name).to.be.a('string');
      expect(userData.email).to.include('@');
      expect(parseInt(userData.age)).to.be.within(18, 65);
      expect(userData.address.country).to.equal('United States');
      expect(userData.preferences.theme).to.equal('dark');
      expect(userData.preferences.language).to.equal('en-US');
      expect(userData.tags).to.deep.equal(['vip', 'beta-tester', 'premium']);
    });

    it('should load and resolve order fixture with cross-references', function() {
      // Set local variables for order
      restified.setLocalVariables({
        productId1: 'prod-001',
        productId2: 'prod-002',
        quantity1: '2',
        quantity2: '1',
        shippingAddress: '123 Main St, City, State',
        shippingMethod: 'express',
        totalAmount: '149.99',
        deliveryDate: '2024-01-15'
      });

      const fixturePath = path.join(__dirname, 'fixtures', 'order.json');
      const orderData = restified.loadJsonFixture(fixturePath);

      expect(orderData.customerId).to.equal('user-12345'); // From global variable
      expect(orderData.orderId).to.match(/^[0-9a-f-]+$/);
      expect(orderData.items).to.have.length(2);
      expect(orderData.items[0].productId).to.equal('prod-001');
      expect(orderData.items[0].quantity).to.equal('2');
      expect(orderData.shipping.address).to.equal('123 Main St, City, State');
      expect(orderData.payment.currency).to.equal('USD');
      expect(orderData.payment.amount).to.equal('149.99');
    });
  });

  describe('JSON String Resolution', function() {
    it('should resolve variables in JSON strings', function() {
      const jsonString = `{
        "userId": "{{userId}}",
        "profile": {
          "name": "{{$faker.person.fullName}}",
          "settings": {
            "theme": "{{userTheme}}",
            "notifications": true
          }
        },
        "timestamp": "{{$date.now}}"
      }`;

      const resolved = restified.resolveJsonString(jsonString);

      expect(resolved.userId).to.equal('user-12345');
      expect(resolved.profile.name).to.be.a('string');
      expect(resolved.profile.settings.theme).to.equal('dark');
      expect(resolved.profile.settings.notifications).to.be.true;
      expect(new Date(resolved.timestamp)).to.be.a('date');
    });
  });

  describe('API Testing with Dynamic Fixtures', function() {
    it('should use resolved fixtures in API requests', async function() {
      // Create dynamic user data
      const userTemplate = {
        name: '{{$faker.person.fullName}}',
        email: '{{$faker.internet.email}}',
        age: '{{$random.number(18,65)}}',
        preferences: {
          theme: '{{userTheme}}',
          language: '{{$env.DEFAULT_LANGUAGE}}'
        }
      };

      const userData = restified.resolveVariables(userTemplate);

      // Use in API request
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .post('/users')
          .json(userData)
          .execute();

      await response
        .statusCode(201)
        .execute();

      // Extract and validate
      expect(userData.name).to.be.a('string');
      expect(userData.email).to.include('@');
      expect(userData.preferences.theme).to.equal('dark');
      expect(userData.preferences.language).to.equal('en-US');
    });

    it('should handle complex nested fixture scenarios', function() {
      // Multi-level variable resolution
      restified.setLocalVariable('baseUrl', 'https://api.example.com');
      restified.setLocalVariable('version', 'v2');
      
      const apiConfig = {
        endpoints: {
          users: '{{baseUrl}}/{{version}}/users',
          orders: '{{baseUrl}}/{{version}}/orders/{{userId}}'
        },
        headers: {
          'Authorization': 'Bearer {{authToken}}',
          'User-Agent': 'RestifiedTS/{{$util.guid}}',
          'X-Request-ID': '{{$random.uuid}}'
        },
        timeout: '{{requestTimeout}}'
      };

      restified.setLocalVariables({
        authToken: 'jwt-token-12345',
        requestTimeout: '30000'
      });

      const resolved = restified.resolveVariables(apiConfig);

      expect(resolved.endpoints.users).to.equal('https://api.example.com/v2/users');
      expect(resolved.endpoints.orders).to.equal('https://api.example.com/v2/orders/user-12345');
      expect(resolved.headers.Authorization).to.equal('Bearer jwt-token-12345');
      expect(resolved.headers['User-Agent']).to.include('RestifiedTS/');
      expect(resolved.timeout).to.equal('30000');
    });
  });
});